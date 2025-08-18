import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin if not already initialized
if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    // Check if Firebase Admin credentials are configured
    if (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Firebase Admin credentials not configured' },
        { status: 500 }
      );
    }

    const db = getFirestore();

    try {
      // Update the user's subscription status to PRO
      const userRef = db.collection('users').doc(userId);
      await userRef.update({
        'subscription.tier': 'pro',
        'subscription.status': 'pro',
        'subscriptionTier': 'pro',
        'subscriptionStatus': 'pro',
        updatedAt: new Date()
      });

      console.log(`✅ User ${userId} subscription updated to PRO`);

      return NextResponse.json({
        success: true,
        message: 'Subscription updated to PRO successfully',
        updatedFields: {
          'subscription.tier': 'pro',
          'subscription.status': 'pro',
          'subscriptionTier': 'pro',
          'subscriptionStatus': 'pro'
        }
      });

    } catch (firestoreError: any) {
      console.error('Firestore error:', firestoreError);
      return NextResponse.json(
        { error: `Failed to update subscription: ${firestoreError.message}` },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error fixing subscription:', error);
    return NextResponse.json(
      { error: 'Unable to fix subscription status' },
      { status: 500 }
    );
  }
}
