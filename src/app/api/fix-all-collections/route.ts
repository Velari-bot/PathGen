import { NextRequest, NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin if not already initialized
function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
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

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    console.log(`🔄 Fixing all collections for user ${userId}...`);
    
    initializeFirebaseAdmin();
    const db = getFirestore();

    const subscriptionData = {
      userId,
      plan: 'pro',
      status: 'active',
      tier: 'pro',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const usageData = {
      userId,
      subscriptionTier: 'pro',
      totalCredits: 4000,
      usedCredits: 0,
      availableCredits: 4000,
      lastReset: new Date(),
      updatedAt: new Date()
    };

    // 1. Update user document
    await db.collection('users').doc(userId).update({
      subscriptionTier: 'pro',
      'subscription.plan': 'pro',
      'subscription.status': 'active',
      'subscription.tier': 'pro',
      'subscription.startDate': new Date(),
      'subscription.autoRenew': true,
      updatedAt: new Date()
    });

    // 2. Update or create subscription document
    const subscriptionsSnapshot = await db.collection('subscriptions')
      .where('userId', '==', userId)
      .get();
    
    if (!subscriptionsSnapshot.empty) {
      await subscriptionsSnapshot.docs[0].ref.update(subscriptionData);
    } else {
      await db.collection('subscriptions').add(subscriptionData);
    }

    // 3. Update or create usage document
    const usageSnapshot = await db.collection('usage')
      .where('userId', '==', userId)
      .get();
    
    if (!usageSnapshot.empty) {
      await usageSnapshot.docs[0].ref.update(usageData);
    } else {
      await db.collection('usage').add(usageData);
    }

    // 4. Add webhook log entry
    await db.collection('webhookLogs').add({
      eventType: 'manual.collection.fix',
      userId,
      plan: 'pro',
      status: 'active',
      timestamp: new Date(),
      success: true,
      message: 'Fixed subscription across all collections'
    });

    console.log(`✅ Successfully fixed user ${userId} across all collections`);

    return NextResponse.json({
      success: true,
      message: 'Fixed subscription across all collections',
      userId,
      collectionsUpdated: ['users', 'subscriptions', 'usage', 'webhookLogs']
    });

  } catch (error) {
    console.error('❌ Error fixing collections:', error);
    return NextResponse.json({ error: 'Failed to fix collections' }, { status: 500 });
  }
}
