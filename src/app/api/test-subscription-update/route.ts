import { NextRequest, NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin if not already initialized
function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    return;
  }

  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PROJECT_ID) {
    try {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    } catch (error: any) {
      if (error.code !== 'app/duplicate-app') {
        console.error('Failed to initialize Firebase Admin:', error);
      }
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, subscriptionTier = 'standard' } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    // Initialize Firebase Admin
    initializeFirebaseAdmin();
    const db = getFirestore();

    if (!db) {
      return NextResponse.json(
        { error: 'Firebase Admin not initialized' },
        { status: 500 }
      );
    }

    // Update user subscription
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      'subscription.tier': subscriptionTier,
      'subscription.status': 'active',
      'subscription.plan': subscriptionTier,
      'subscriptionTier': subscriptionTier,
      'subscriptionStatus': 'active',
      updatedAt: new Date()
    });

    // Create/update subscription document
    const subscriptionRef = db.collection('subscriptions').doc(userId);
    await subscriptionRef.set({
      userId,
      plan: subscriptionTier,
      status: 'active',
      tier: subscriptionTier,
      createdAt: new Date(),
      updatedAt: new Date(),
      stripeCustomerId: 'test_customer_id',
      stripeSubscriptionId: 'test_subscription_id'
    }, { merge: true });

    // Update usage limits based on tier
    const usageRef = db.collection('usage').doc(userId);
    const usageData = {
      userId,
      updatedAt: new Date(),
      subscriptionTier: subscriptionTier
    };

    if (subscriptionTier === 'standard') {
      Object.assign(usageData, {
        ai: {
          conversationsCreated: 0,
          messagesUsed: 0,
          lastReset: new Date()
        },
        epic: {
          lastSync: new Date(),
          statsPulled: 0,
          syncCount: 0,
          lastActivity: new Date()
        },
        osirion: {
          computeRequestsUsed: 0,
          eventTypesUsed: 0,
          lastReset: new Date(),
          matchesUsed: 0,
          replayUploadsUsed: 0,
          subscriptionTier: 'standard',
          totalSessions: 0,
          updatedAt: new Date()
        }
      });
    }

    await usageRef.set(usageData, { merge: true });

    return NextResponse.json({
      success: true,
      message: `Subscription updated to ${subscriptionTier}`,
      subscriptionTier,
      updatedAt: new Date()
    });

  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
