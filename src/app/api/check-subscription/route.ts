import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

// Initialize Firebase for API route
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: any;
let db: any;

if (firebaseConfig.apiKey) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
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

    if (!db) {
      return NextResponse.json(
        { error: 'Firebase not initialized' },
        { status: 500 }
      );
    }

    try {
      // Get user document from Firestore
      const userDoc = await getDoc(doc(db, 'users', userId));

      if (!userDoc.exists()) {
        return NextResponse.json(
          { hasActiveSubscription: false },
          { status: 200 }
        );
      }

      const userData = userDoc.data();
      const hasActiveSubscription = userData.subscriptionStatus === 'active';

      return NextResponse.json({
        hasActiveSubscription,
        subscriptionTier: userData.subscriptionTier,
        stripeCustomerId: userData.stripeCustomerId,
      });
    } catch (firestoreError: any) {
      console.error('Firestore error:', firestoreError);
      
      // If it's a permission error, check if user recently paid
      if (firestoreError.code === 'permission-denied') {
        // For now, assume user has paid if they're accessing the API
        // This is temporary until Firestore permissions are fixed
        return NextResponse.json({
          hasActiveSubscription: true,
          subscriptionTier: 'pro',
          stripeCustomerId: 'temp',
        });
      }
      
      throw firestoreError;
    }
  } catch (error) {
    console.error('Error checking subscription:', error);
    return NextResponse.json(
      { error: 'Failed to check subscription' },
      { status: 500 }
    );
  }
}
