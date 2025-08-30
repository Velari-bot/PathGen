import { NextRequest, NextResponse } from 'next/server';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get usage data from the usage collection
    const usageRef = db.collection('usage').doc(userId);
    const usageDoc = await usageRef.get();

    let usageData = {};
    if (usageDoc.exists) {
      usageData = usageDoc.data() || {};
    }

    // Get user subscription tier
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    let subscriptionTier = 'free';
    if (userDoc.exists) {
      const userData = userDoc.data();
      subscriptionTier = userData?.subscriptionTier || userData?.subscription?.tier || 'free';
    }

    // Calculate limits based on subscription tier
    const limits = subscriptionTier === 'pro' ? {
      aiMessages: 4000,
      osirionPulls: 80,
      replayUploads: 200,
      tournamentStrategies: 400
    } : {
      aiMessages: 250,
      osirionPulls: 5,
      replayUploads: 12,
      tournamentStrategies: 25
    };

    return NextResponse.json({
      usage: usageData,
      limits,
      subscriptionTier
    });

  } catch (error) {
    console.error('Error getting usage data:', error);
    return NextResponse.json(
      { error: 'Failed to get usage data' },
      { status: 500 }
    );
  }
}
