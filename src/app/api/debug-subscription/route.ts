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
      // Check current subscription status
      const userDoc = await db.collection('users').doc(userId).get();
      const subscriptionsSnapshot = await db.collection('subscriptions')
        .where('userId', '==', userId)
        .get();

      const userData = userDoc.exists ? userDoc.data() : null;
      const subscriptionData = !subscriptionsSnapshot.empty ? subscriptionsSnapshot.docs[0].data() : null;

      return NextResponse.json({
        userId,
        userData,
        subscriptionData,
        hasUserDoc: userDoc.exists,
        hasSubscriptionDoc: !subscriptionsSnapshot.empty,
        subscriptionTier: userData?.subscriptionTier || userData?.subscription?.tier || 'free',
        subscriptionStatus: userData?.subscription?.status || 'free'
      });

    } else if (action === 'update') {
      // Manually update to Pro
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

      // Update user document
      await db.collection('users').doc(userId).update({
        subscriptionTier: 'pro',
        'subscription.plan': 'pro',
        'subscription.status': 'active',
        'subscription.tier': 'pro',
        updatedAt: new Date()
      });

      // Create subscription document
      await db.collection('subscriptions').add(subscriptionData);

      return NextResponse.json({
        success: true,
        message: 'Manually updated to Pro tier',
        subscriptionData
      });

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Debug subscription error:', error);
    return NextResponse.json({ error: 'Debug subscription failed' }, { status: 500 });
  }
}
