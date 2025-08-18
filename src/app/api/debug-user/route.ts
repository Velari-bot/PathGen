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
        return NextResponse.json({
          error: 'User not found',
          userId: userId
        });
      }

      const userData = userDoc.data();
      
      // Return all the data for debugging
      return NextResponse.json({
        userId: userId,
        userExists: true,
        userDataFields: Object.keys(userData),
        // Check for common subscription field names
        subscriptionChecks: {
          subscriptionTier: userData.subscriptionTier,
          subscriptionStatus: userData.subscriptionStatus,
          tier: userData.tier,
          status: userData.status,
          subscriptionTierNested: userData.subscription?.tier,
          subscriptionStatusNested: userData.subscription?.status
        },
        // Show a few key fields without the entire object
        keyFields: {
          email: userData.email,
          displayName: userData.displayName,
          subscription: userData.subscription ? 'exists' : 'missing',
          subscriptionTier: userData.subscriptionTier,
          subscriptionStatus: userData.subscriptionStatus
        }
      });
    } catch (firestoreError: any) {
      console.error('Firestore error:', firestoreError);
      return NextResponse.json(
        { 
          error: 'Firestore error',
          details: firestoreError.message,
          code: firestoreError.code
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error debugging user:', error);
    return NextResponse.json(
      { 
        error: 'Unable to debug user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
