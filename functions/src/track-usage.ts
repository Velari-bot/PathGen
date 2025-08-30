import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { UsageTrackingRequest } from './types/subscription';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Track usage for a specific feature
export const trackUsage = functions.https.onCall(async (request, context) => {
  if (!context?.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const data = request.data as UsageTrackingRequest;
  const userId = context.auth.uid;
  const { feature, tokensUsed = 0, metadata = {} } = data;

  try {
    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();
    if (!userData) {
      throw new functions.https.HttpsError('not-found', 'User data not found');
    }

    // Get subscription tier from user data
    const subscriptionTier = userData.subscriptionTier || userData.subscription?.tier || 'free';

    // Get usage data from the usage collection
    const usageRef = db.collection('usage').doc(userId);
    const usageDoc = await usageRef.get();
    
    let usageData: any = {};
    if (usageDoc.exists) {
      usageData = usageDoc.data() || {};
    }

    // Map feature to usage field
    const featureMap = {
      'message': 'aiMessages',
      'data_pull': 'osirionPulls',
      'replay_upload': 'replayUploads',
      'tournament_strategy': 'tournamentStrategies'
    };

    const usageField = featureMap[feature] || 'aiMessages';
    const currentUsage = usageData[usageField] || 0;

    // Get limits based on subscription tier
    const limits = getLimitsForTier(subscriptionTier);
    const limit = limits[usageField] || 1000; // Default limit

    // Check if user has exceeded limits
    if (limit !== -1 && currentUsage >= limit) {
      return {
        success: false,
        usageTracked: false,
        limitReached: true,
        remainingTokens: 0
      };
    }

    // Update usage in the usage collection
    const newUsage = currentUsage + 1;
    const updateData = {
      [usageField]: newUsage,
      lastUpdated: admin.firestore.Timestamp.now(),
      userId: userId,
      subscriptionTier: subscriptionTier
    };

    await usageRef.set(updateData, { merge: true });

    // Log usage event
    await db.collection('usageEvents').add({
      userId,
      feature,
      tokensUsed,
      metadata,
      timestamp: admin.firestore.Timestamp.now(),
      plan: subscriptionTier
    });

    console.log(`Usage tracked for user ${userId}: ${feature} (${newUsage}/${limit})`);

    return {
      success: true,
      usageTracked: true,
      remainingTokens: limit === -1 ? -1 : Math.max(0, limit - newUsage)
    };

  } catch (error) {
    console.error('Error tracking usage:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to track usage');
  }
});

// Get current usage for a user
export const getCurrentUsage = functions.https.onCall(async (request, context) => {
  if (!context?.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;

  try {
    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();
    if (!userData) {
      throw new functions.https.HttpsError('not-found', 'User data not found');
    }

    // Get subscription tier from user data
    const subscriptionTier = userData.subscriptionTier || userData.subscription?.tier || 'free';
    
    // Get usage data from the usage collection
    const usageRef = db.collection('usage').doc(userId);
    const usageDoc = await usageRef.get();
    
    let usageData: any = {};
    if (usageDoc.exists) {
      usageData = usageDoc.data() || {};
    }

    // Get limits based on subscription tier
    const limits = getLimitsForTier(subscriptionTier);

    return {
      hasSubscription: true,
      plan: subscriptionTier,
      limits,
      usage: usageData,
      resetDate: usageData.lastUpdated
    };

  } catch (error) {
    console.error('Error getting current usage:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to get current usage');
  }
});

// Reset user usage (admin function)
export const resetUserUsage = functions.https.onCall(async (request, context) => {
  if (!context?.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const data = request.data as { targetUserId?: string };
  const adminUserId = context.auth.uid;
  const targetUserId = data.targetUserId || adminUserId;

  try {
    // Check if admin user has permission (admin or same user)
    if (adminUserId !== targetUserId) {
      const adminDoc = await db.collection('users').doc(adminUserId).get();
      if (!adminDoc.exists) {
        throw new functions.https.HttpsError('permission-denied', 'Admin user not found');
      }
      
      const adminData = adminDoc.data();
      if (!adminData?.isAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'Admin access required');
      }
    }

    // Reset usage for target user in the usage collection
    const defaultUsage = {
      aiMessages: 0,
      osirionPulls: 0,
      replayUploads: 0,
      tournamentStrategies: 0,
      lastUpdated: admin.firestore.Timestamp.now(),
      userId: targetUserId
    };
    
    await db.collection('usage').doc(targetUserId).set(defaultUsage);

    console.log(`Usage reset for user ${targetUserId} by admin ${adminUserId}`);

    return { success: true };

  } catch (error) {
    console.error('Error resetting user usage:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to reset user usage');
  }
});

// Monthly usage reset (scheduled function)
export const monthlyUsageReset = functions.pubsub.schedule('0 0 1 * *').onRun(async (context) => {
  try {
    console.log('Starting monthly usage reset...');
    
    // Get all users with subscriptions
    const usersSnapshot = await db.collection('users')
      .where('subscription.plan', 'in', ['standard', 'pro'])
      .get();

    const batch = db.batch();
    let resetCount = 0;

    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.subscription || userData.subscriptionTier) {
        const defaultUsage = {
          aiMessages: 0,
          osirionPulls: 0,
          replayUploads: 0,
          tournamentStrategies: 0,
          lastUpdated: admin.firestore.Timestamp.now(),
          userId: doc.id
        };
        batch.set(db.collection('usage').doc(doc.id), defaultUsage);
        resetCount++;
      }
    });

    if (resetCount > 0) {
      await batch.commit();
      console.log(`Monthly usage reset completed for ${resetCount} users`);
    } else {
      console.log('No users found for monthly usage reset');
    }

  } catch (error) {
    console.error('Error during monthly usage reset:', error);
    throw error;
  }
});

// Helper functions
function getLimitsForTier(tier: string): any {
  const limits = {
    free: { 
      aiMessages: 250, 
      osirionPulls: 5, 
      replayUploads: 12, 
      tournamentStrategies: 25 
    },
    pro: { 
      aiMessages: 4000, 
      osirionPulls: 80, 
      replayUploads: 200, 
      tournamentStrategies: 400 
    }
  };
  return limits[tier as keyof typeof limits] || limits.free;
}
