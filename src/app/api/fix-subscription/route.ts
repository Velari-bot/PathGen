import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin if not already initialized
let firebaseAdminInitialized = false;

function initializeFirebaseAdmin() {
  if (firebaseAdminInitialized || getApps().length > 0) {
    return;
  }
  
  // Only initialize if we have the required environment variables
  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PROJECT_ID) {
    try {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
      firebaseAdminInitialized = true;
      console.log('✅ Firebase Admin initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase Admin:', error);
    }
  } else {
    console.error('❌ Missing Firebase Admin environment variables');
  }
}

export async function POST(request: NextRequest) {
  try {
    // Initialize Firebase Admin when the API is actually called
    initializeFirebaseAdmin();
    
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
      // Update the user's subscription status to STANDARD (paid)
      const userRef = db.collection('users').doc(userId);
      await userRef.update({
        'subscription.tier': 'standard',
        'subscription.status': 'active',
        'subscriptionTier': 'standard',
        'subscriptionStatus': 'active',
        updatedAt: new Date()
      });

      console.log(`✅ User ${userId} subscription updated to STANDARD`);

      return NextResponse.json({
        success: true,
        message: 'Subscription updated to STANDARD successfully',
        updatedFields: {
          'subscription.tier': 'standard',
          'subscription.status': 'active',
          'subscriptionTier': 'standard',
          'subscriptionStatus': 'active'
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
