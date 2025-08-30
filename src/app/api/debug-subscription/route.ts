import { NextRequest, NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin if not already initialized
function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      try {
        initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID || 'pathgen-a771b',
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
        });
      } catch (error: any) {
        if (error.code !== 'app/duplicate-app') {
          console.error('❌ Firebase Admin initialization error:', error);
        }
      }
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, action } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    initializeFirebaseAdmin();
    const db = getFirestore();

    if (action === 'check') {
      // Check current subscription status across all collections
      const userDoc = await db.collection('users').doc(userId).get();
      const subscriptionsSnapshot = await db.collection('subscriptions')
        .where('userId', '==', userId)
        .get();
      const usageSnapshot = await db.collection('usage')
        .where('userId', '==', userId)
        .get();
      const webhookLogsSnapshot = await db.collection('webhookLogs')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(5)
        .get();

      const userData = userDoc.exists ? userDoc.data() : null;
      const subscriptionData = !subscriptionsSnapshot.empty ? subscriptionsSnapshot.docs[0].data() : null;
      const usageData = !usageSnapshot.empty ? usageSnapshot.docs[0].data() : null;
      const webhookLogs = webhookLogsSnapshot.docs.map(doc => doc.data());

      return NextResponse.json({
        userId,
        userData,
        subscriptionData,
        usageData,
        webhookLogs,
        hasUserDoc: userDoc.exists,
        hasSubscriptionDoc: !subscriptionsSnapshot.empty,
        hasUsageDoc: !usageSnapshot.empty,
        subscriptionTier: userData?.subscriptionTier || userData?.subscription?.tier || 'free',
        subscriptionStatus: userData?.subscription?.status || 'free',
        usageTier: usageData?.subscriptionTier || 'free'
      });

    } else if (action === 'update') {
      // Manually update to Pro across ALL collections
      const subscriptionData = {
        userId,
        plan: 'pro',
        status: 'active',
        tier: 'pro',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log(`🔄 Updating user ${userId} to Pro tier across ALL collections...`);

      // Update user document
      await db.collection('users').doc(userId).update({
        subscriptionTier: 'pro',
        'subscription.plan': 'pro',
        'subscription.status': 'active',
        'subscription.tier': 'pro',
        'subscription.startDate': new Date(),
        'subscription.autoRenew': true,
        updatedAt: new Date()
      });

      // Update or create subscription document
      const subscriptionsSnapshot = await db.collection('subscriptions')
        .where('userId', '==', userId)
        .get();
      
      if (!subscriptionsSnapshot.empty) {
        // Update existing subscription
        await subscriptionsSnapshot.docs[0].ref.update(subscriptionData);
      } else {
        // Create new subscription document
        await db.collection('subscriptions').add(subscriptionData);
      }

      // Update or create usage document
      const usageSnapshot = await db.collection('usage')
        .where('userId', '==', userId)
        .get();
      
      const usageData = {
        userId,
        subscriptionTier: 'pro',
        totalCredits: 4000,
        usedCredits: 0,
        availableCredits: 4000,
        lastReset: new Date(),
        updatedAt: new Date()
      };

      if (!usageSnapshot.empty) {
        // Update existing usage
        await usageSnapshot.docs[0].ref.update(usageData);
      } else {
        // Create new usage document
        await db.collection('usage').add(usageData);
      }

      // Add webhook log entry
      await db.collection('webhookLogs').add({
        eventType: 'manual.subscription.update',
        userId,
        plan: 'pro',
        status: 'active',
        timestamp: new Date(),
        success: true,
        message: 'Manually updated to Pro tier across all collections'
      });

      console.log(`✅ Successfully updated user ${userId} to Pro tier across all collections`);

      return NextResponse.json({
        success: true,
        message: 'Manually updated to Pro tier across ALL collections',
        subscriptionData,
        usageData,
        collectionsUpdated: ['users', 'subscriptions', 'usage', 'webhookLogs']
      });

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Debug subscription error:', error);
    return NextResponse.json({ error: 'Debug subscription failed' }, { status: 500 });
  }
}
