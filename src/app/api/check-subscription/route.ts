import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
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

// Subscription plan limits
const SUBSCRIPTION_PLANS = {
  free: {
    monthlyMessages: 10,
    monthlyTokens: 1000,
    monthlyDataPulls: 5,
    replayUploads: 0,
    tournamentStrategies: 0,
    prioritySupport: false,
    advancedAnalytics: false
  },
  standard: {
    monthlyMessages: 100,
    monthlyTokens: 10000,
    monthlyDataPulls: 50,
    replayUploads: 5,
    tournamentStrategies: 10,
    prioritySupport: false,
    advancedAnalytics: true
  },
  pro: {
    monthlyMessages: 1000,
    monthlyTokens: 100000,
    monthlyDataPulls: 500,
    replayUploads: 50,
    tournamentStrategies: 100,
    prioritySupport: true,
    advancedAnalytics: true
  }
};

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
      
      // Also check subscriptions collection
      const subscriptionsQuery = query(
        collection(db, 'subscriptions'),
        where('userId', '==', userId)
      );
      const subscriptionsSnapshot = await getDocs(subscriptionsQuery);
      
      let subscriptionData = null;
      if (!subscriptionsSnapshot.empty) {
        subscriptionData = subscriptionsSnapshot.docs[0].data();
        console.log('Found subscription in subscriptions collection:', subscriptionData);
      }

      if (!userDoc.exists()) {
        // Return free tier for new users
        return NextResponse.json({
          hasActiveSubscription: true, // Free users can access dashboard
          subscriptionTier: 'free',
          tier: 'free',
          usage: {
            messagesUsed: 0,
            tokensUsed: 0,
            dataPullsUsed: 0,
            replayUploadsUsed: 0,
            tournamentStrategiesUsed: 0,
            remaining: 10, // Free tier limit
            resetDate: new Date()
          },
          limits: SUBSCRIPTION_PLANS.free
        });
      }

      const userData = userDoc.data();
      
      // Comprehensive debugging
      console.log('=== SUBSCRIPTION DEBUG INFO ===');
      console.log('User ID:', userId);
      console.log('User data fields:', Object.keys(userData));
      console.log('User subscription data:', userData.subscription);
      console.log('User subscriptionTier field:', userData.subscriptionTier);
      console.log('User subscriptionStatus field:', userData.subscriptionStatus);
      console.log('User tier field:', userData.tier);
      console.log('User status field:', userData.status);
      console.log('Separate subscription data:', subscriptionData);
      console.log('Has separate subscription:', !subscriptionsSnapshot.empty);
      console.log('All user data:', JSON.stringify(userData, null, 2));
      console.log('=== END DEBUG INFO ===');
      
      // Search for any field that contains "pro" subscription data
      let foundProSubscription = false;
      let subscriptionTier = 'free';
      let subscriptionStatus = 'free';
      
      // Check all possible field locations
      const possibleFields = [
        userData.subscriptionTier,
        userData.subscriptionStatus,
        userData.tier,
        userData.status,
        userData.subscription?.tier,
        userData.subscription?.status,
        subscriptionData?.plan,
        subscriptionData?.status
      ];
      
      // Also check if any nested object contains "pro"
      const checkForPro = (obj: any, path: string = '') => {
        if (!obj || typeof obj !== 'object') return;
        
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;
          
          if (typeof value === 'string' && value.toLowerCase() === 'pro') {
            console.log(`Found "pro" at path: ${currentPath} = ${value}`);
            foundProSubscription = true;
            subscriptionTier = 'pro';
            subscriptionStatus = 'pro';
          } else if (typeof value === 'object' && value !== null) {
            checkForPro(value, currentPath);
          }
        }
      };
      
      // Check user data recursively
      checkForPro(userData, 'userData');
      checkForPro(subscriptionData, 'subscriptionData');
      
      // If we didn't find "pro" in the recursive search, use the direct field values
      if (!foundProSubscription) {
        subscriptionTier = subscriptionData?.plan || 
                          userData.subscriptionTier || 
                          userData.subscription?.tier || 
                          userData.tier ||
                          'free';
                          
        subscriptionStatus = subscriptionData?.status || 
                            userData.subscriptionStatus || 
                            userData.subscription?.status || 
                            userData.status ||
                            'free';
      }
      
      // Map subscription status to active/inactive
      const isActive = subscriptionStatus === 'free' || 
                      subscriptionStatus === 'basic' || 
                      subscriptionStatus === 'pro' || 
                      subscriptionStatus === 'premium' ||
                      subscriptionStatus === 'active';
      
      // Map tier to the format expected by subscription plans
      let planForLimits: 'free' | 'standard' | 'pro' = 'free';
      if (subscriptionTier === 'basic' || subscriptionTier === 'standard') {
        planForLimits = 'standard';
      } else if (subscriptionTier === 'pro' || subscriptionTier === 'premium') {
        planForLimits = 'pro';
      }
      
      console.log('Final subscription tier:', subscriptionTier);
      console.log('Final subscription status:', subscriptionStatus);
      console.log('Plan for limits:', planForLimits);
      
      // Get subscription plan limits
      const limits = SUBSCRIPTION_PLANS[planForLimits];
      
      // Get current usage from subscription if available (prioritize subscriptions collection)
      const usage = subscriptionData?.usage || userData.subscription?.usage || userData.usage || {
        messagesUsed: 0,
        tokensUsed: 0,
        dataPullsUsed: 0,
        replayUploadsUsed: 0,
        tournamentStrategiesUsed: 0,
        resetDate: new Date()
      };

      return NextResponse.json({
        hasActiveSubscription: isActive,
        subscriptionTier,
        tier: subscriptionTier,
        usage: {
          ...usage,
          remaining: limits.monthlyMessages - usage.messagesUsed
        },
        limits: limits,
        debug: {
          foundTier: subscriptionTier,
          foundStatus: subscriptionStatus,
          planForLimits,
          foundProSubscription,
          userDataFields: Object.keys(userData),
          subscriptionFields: userData.subscription ? Object.keys(userData.subscription) : [],
          separateSubscriptionData: subscriptionData,
          hasSeparateSubscription: !subscriptionsSnapshot.empty,
          allUserData: userData,
          allSubscriptionData: subscriptionData
        }
      });
    } catch (firestoreError: any) {
      console.error('Firestore error:', firestoreError);
      
      // If it's a permission error, return free tier
      if (firestoreError.code === 'permission-denied') {
        return NextResponse.json({
          hasActiveSubscription: false,
          subscriptionTier: 'free',
          tier: 'free',
          usage: {
            messagesUsed: 0,
            tokensUsed: 0,
            dataPullsUsed: 0,
            replayUploadsUsed: 0,
            tournamentStrategiesUsed: 0,
            remaining: SUBSCRIPTION_PLANS.free.monthlyMessages,
            resetDate: new Date()
          },
          limits: SUBSCRIPTION_PLANS.free
        });
      }
      
      throw firestoreError;
    }
  } catch (error) {
    console.error('Error checking subscription:', error);
    
    // Return a more user-friendly error message
    return NextResponse.json(
      { 
        error: 'Unable to verify subscription status',
        message: 'Please try again later or contact support if the issue persists'
      },
      { status: 500 }
    );
  }
}
