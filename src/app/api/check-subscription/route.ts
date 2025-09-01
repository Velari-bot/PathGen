import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin-api';

// Subscription plan limits
const SUBSCRIPTION_PLANS = {
  free: {
    monthlyMessages: 10,
    monthlyTokens: 1000,
    monthlyDataPulls: 5,
    replayUploads: 0,
    tournamentStrategies: 0,
    prioritySupport: false,
    advancedAnalytics: false
  },
  pro: {
    monthlyMessages: 1000,
    monthlyTokens: 100000,
    monthlyDataPulls: 500,
    replayUploads: 50,
    tournamentStrategies: 100,
    prioritySupport: true,
    advancedAnalytics: true
  }
};

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    try {
      const db = getDb();

      if (!db) {
        return NextResponse.json(
          { error: 'Firebase Admin not initialized' },
          { status: 500 }
        );
      }

      // Get user document from Firestore
      const userDoc = await db.collection('users').doc(userId).get();
      
      // Also check subscriptions collection
      const subscriptionsSnapshot = await db.collection('subscriptions')
        .where('userId', '==', userId)
        .get();
      
      let subscriptionData = null;
      if (!subscriptionsSnapshot.empty) {
        subscriptionData = subscriptionsSnapshot.docs[0].data();
        console.log('Found subscription in subscriptions collection:', subscriptionData);
      }

      // Check webhook logs for the most recent successful pro subscription
      const webhookLogs = await db.collection('webhookLogs')
        .where('userId', '==', userId)
        .get();
      
      let webhookProSubscription = false;
      if (!webhookLogs.empty) {
        for (const doc of webhookLogs.docs) {
          const log = doc.data();
          if (log.plan === 'pro' && log.success === true) {
            webhookProSubscription = true;
            console.log('Found pro subscription in webhook log:', log.eventType, log.timestamp);
            break;
          }
        }
      }

      if (!userDoc.exists) {
        // Return free tier for new users
        return NextResponse.json({
          hasActiveSubscription: true, // Free users can access dashboard
          subscriptionTier: 'free',
          tier: 'free',
          usage: {
            messagesUsed: 0,
            tokensUsed: 0,
            dataPullsUsed: 0,
            replayUploadsUsed: 0,
            tournamentStrategiesUsed: 0,
            remaining: 10, // Free tier limit
            resetDate: new Date()
          },
          limits: SUBSCRIPTION_PLANS.free
        });
      }

      const userData = userDoc.data();
      
      // Comprehensive debugging
      console.log('=== SUBSCRIPTION DEBUG INFO ===');
      console.log('User ID:', userId);
      console.log('User data fields:', userData ? Object.keys(userData) : 'No user data');
      console.log('User subscription data:', userData?.subscription);
      console.log('User subscriptionTier field:', userData?.subscriptionTier);
      console.log('User subscriptionStatus field:', userData?.subscriptionStatus);
      console.log('User tier field:', userData?.tier);
      console.log('User status field:', userData?.status);
      console.log('Separate subscription data:', subscriptionData);
      console.log('Has separate subscription:', !subscriptionsSnapshot.empty);
      console.log('All user data:', userData ? JSON.stringify(userData, null, 2) : 'No user data');
      console.log('=== END DEBUG INFO ===');
      
      // Search for any field that contains "pro" subscription data
      let foundProSubscription = false;
      let subscriptionTier = 'free';
      let subscriptionStatus = 'free';
      
      // Check all possible field locations
      const possibleFields = [
        userData?.subscriptionTier,
        userData?.subscriptionStatus,
        userData?.tier,
        userData?.status,
        userData?.subscription?.tier,
        userData?.subscription?.status,
        subscriptionData?.plan,
        subscriptionData?.status
      ];
      
      // Also check if any nested object contains "pro"
      const checkForPro = (obj: any, path: string = '') => {
        if (!obj || typeof obj !== 'object') return;
        
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;
          
          if (typeof value === 'string' && value.toLowerCase() === 'pro') {
            console.log(`Found "pro" at path: ${currentPath} = ${value}`);
            foundProSubscription = true;
            subscriptionTier = 'pro';
            subscriptionStatus = 'pro';
          } else if (typeof value === 'object' && value !== null) {
            checkForPro(value, currentPath);
          }
        }
      };
      
      // Check user data recursively
      if (userData) {
        checkForPro(userData, 'userData');
      }
      if (subscriptionData) {
        checkForPro(subscriptionData, 'subscriptionData');
      }
      
      // If we didn't find "pro" in the recursive search, use the direct field values
      if (!foundProSubscription) {
        // Prioritize webhook logs over other sources
        if (webhookProSubscription) {
          subscriptionTier = 'pro';
          subscriptionStatus = 'active';
          foundProSubscription = true;
          console.log('Using pro subscription from webhook logs');
        } else {
          subscriptionTier = subscriptionData?.plan || 
                            userData?.subscriptionTier || 
                            userData?.subscription?.tier || 
                            userData?.tier ||
                            'free';
                            
          subscriptionStatus = subscriptionData?.status || 
                              userData?.subscriptionStatus || 
                              userData?.subscription?.status || 
                              userData?.status ||
                              'free';
        }
      }
      
      // Map subscription status to active/inactive
      const isActive = subscriptionStatus === 'free' || 
                      subscriptionStatus === 'basic' || 
                      subscriptionStatus === 'pro' || 
                      subscriptionStatus === 'premium' ||
                      subscriptionStatus === 'active';
      
      // Map tier to the format expected by subscription plans
      let planForLimits: 'free' | 'pro' = 'free';
      if (subscriptionTier === 'pro' || subscriptionTier === 'premium') {
        planForLimits = 'pro';
      }
      
      console.log('Final subscription tier:', subscriptionTier);
      console.log('Final subscription status:', subscriptionStatus);
      console.log('Plan for limits:', planForLimits);
      
      // Get subscription plan limits
      const limits = SUBSCRIPTION_PLANS[planForLimits];
      
      // Get current usage from subscription if available (prioritize subscriptions collection)
      const usage = subscriptionData?.usage || userData?.subscription?.usage || userData?.usage || {
        messagesUsed: 0,
        tokensUsed: 0,
        dataPullsUsed: 0,
        replayUploadsUsed: 0,
        tournamentStrategiesUsed: 0,
        resetDate: new Date()
      };

      return NextResponse.json({
        hasActiveSubscription: isActive,
        subscriptionTier,
        tier: subscriptionTier,
        usage: {
          ...usage,
          remaining: limits.monthlyMessages - usage.messagesUsed
        },
        limits: limits,
        timestamp: new Date().toISOString(), // Add timestamp to prevent caching
        debug: {
          foundTier: subscriptionTier,
          foundStatus: subscriptionStatus,
          planForLimits,
          foundProSubscription,
          webhookProSubscription,
          userDataFields: userData ? Object.keys(userData) : [],
          subscriptionFields: userData?.subscription ? Object.keys(userData.subscription) : [],
          separateSubscriptionData: subscriptionData,
          hasSeparateSubscription: !subscriptionsSnapshot.empty,
          allUserData: userData,
          allSubscriptionData: subscriptionData
        }
      });
    } catch (firestoreError: any) {
      console.error('Firestore error:', firestoreError);
      
      // If it's a permission error, return free tier
      if (firestoreError.code === 'permission-denied') {
        return NextResponse.json({
          hasActiveSubscription: false,
          subscriptionTier: 'free',
          tier: 'free',
          usage: {
            messagesUsed: 0,
            tokensUsed: 0,
            dataPullsUsed: 0,
            replayUploadsUsed: 0,
            tournamentStrategiesUsed: 0,
            remaining: SUBSCRIPTION_PLANS.free.monthlyMessages,
            resetDate: new Date()
          },
          limits: SUBSCRIPTION_PLANS.free
        });
      }
      
      throw firestoreError;
    }
  } catch (error: any) {
    console.error('Error checking subscription:', error);
    console.error('Error details:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
      code: error?.code
    });
    
    // Return a more user-friendly error message
    return NextResponse.json(
      { 
        error: 'Unable to verify subscription status',
        message: 'Please try again later or contact support if the issue persists',
        debug: {
          errorName: error?.name,
          errorMessage: error?.message,
          errorCode: error?.code
        }
      },
      { status: 500 }
    );
  }
}
