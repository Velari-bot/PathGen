import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { SUBSCRIPTION_TIERS, UsageTracker } from '@/lib/osirion';

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
        // Return free tier for new users
        const freeTier = SUBSCRIPTION_TIERS.free;
        const usage = await UsageTracker.checkUsage(userId, 'free');
        
        return NextResponse.json({
          hasActiveSubscription: false,
          subscriptionTier: 'free',
          tier: freeTier,
          usage: usage,
          limits: freeTier.limits
        });
      }

      const userData = userDoc.data();
      const subscriptionTier = userData.subscriptionTier || 'free';
      const hasActiveSubscription = userData.subscriptionStatus === 'active';
      
      // Get the tier details
      const tier = SUBSCRIPTION_TIERS[subscriptionTier as keyof typeof SUBSCRIPTION_TIERS] || SUBSCRIPTION_TIERS.free;
      
      // Get current usage
      const usage = await UsageTracker.checkUsage(userId, subscriptionTier as keyof typeof SUBSCRIPTION_TIERS);

      return NextResponse.json({
        hasActiveSubscription,
        subscriptionTier,
        stripeCustomerId: userData.stripeCustomerId,
        tier: tier,
        usage: usage,
        limits: tier.limits
      });
    } catch (firestoreError: any) {
      console.error('Firestore error:', firestoreError);
      
      // If it's a permission error, return free tier
      if (firestoreError.code === 'permission-denied') {
        const freeTier = SUBSCRIPTION_TIERS.free;
        const usage = await UsageTracker.checkUsage(userId, 'free');
        
        return NextResponse.json({
          hasActiveSubscription: false,
          subscriptionTier: 'free',
          tier: freeTier,
          usage: usage,
          limits: freeTier.limits
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
