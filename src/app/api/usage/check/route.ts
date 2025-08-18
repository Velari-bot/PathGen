import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  try {
    // Initialize Firebase Admin if not already initialized
    if (getApps().length === 0) {
      // Only initialize if we have the required environment variables
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
            return NextResponse.json({
              success: false,
              error: 'Firebase initialization failed',
              details: error.message
            }, { status: 500 });
          }
        }
      }
    }

    const db = getFirestore();
    
    // Get userId from query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required',
        message: 'Please provide a userId query parameter'
      }, { status: 400 });
    }

    try {
      const usageRef = db.collection('usage').doc(userId);
      const usageDoc = await usageRef.get();
      
      // Calculate current month
      const currentMonth = new Date().getFullYear() * 100 + new Date().getMonth() + 1;
      
      if (usageDoc.exists) {
        const usageData = usageDoc.data();
        const lastUsageMonth = usageData?.lastMonth || 0;
        
        // Check if we need to reset for new month
        let osirionPulls = usageData?.osirionPulls || 0;
        let lastReset = usageData?.lastReset;
        
        if (currentMonth > lastUsageMonth) {
          // Reset for new month
          await usageRef.set({
            lastMonth: currentMonth,
            osirionPulls: 0,
            lastReset: new Date()
          }, { merge: true });
          
          osirionPulls = 0;
          lastReset = new Date();
          console.log('🔄 Reset monthly usage counter for new month');
        }
        
        // Get user's subscription tier to determine limits
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        const userData = userDoc.exists ? userDoc.data() : {};
        
        // Determine limits based on subscription tier
        let monthlyLimit = 10; // Free tier default
        let pullsPerMonth = 10;
        
        if (userData.subscriptionTier === 'standard') {
          monthlyLimit = 50;
          pullsPerMonth = 50;
        } else if (userData.subscriptionTier === 'pro') {
          monthlyLimit = 500;
          pullsPerMonth = 500;
        }
        
        return NextResponse.json({
          success: true,
          usage: {
            userId: userId,
            currentMonth: currentMonth,
            osirionPulls: osirionPulls,
            osirionPullsRemaining: monthlyLimit - osirionPulls,
            monthlyLimit: monthlyLimit,
            lastReset: lastReset,
            lastPull: usageData?.lastPull || null
          },
          limits: {
            osirion: {
              pullsPerMonth: pullsPerMonth,
              resetsMonthly: true,
              description: `Osirion API pulls per month (${userData.subscriptionTier || 'free'} tier)`
            }
          }
        });
      } else {
        // Initialize usage for new user
        const newUsage = {
          lastMonth: currentMonth,
          osirionPulls: 0,
          lastReset: new Date()
        };
        
        await usageRef.set(newUsage);
        
        // Get user's subscription tier to determine limits
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        const userData = userDoc.exists ? userDoc.data() : {};
        
        // Determine limits based on subscription tier
        let monthlyLimit = 10; // Free tier default
        let pullsPerMonth = 10;
        
        if (userData.subscriptionTier === 'standard') {
          monthlyLimit = 50;
          pullsPerMonth = 50;
        } else if (userData.subscriptionTier === 'pro') {
          monthlyLimit = 500;
          pullsPerMonth = 500;
        }
        
        return NextResponse.json({
          success: true,
          usage: {
            userId: userId,
            currentMonth: currentMonth,
            osirionPulls: 0,
            osirionPullsRemaining: monthlyLimit,
            monthlyLimit: monthlyLimit,
            lastReset: new Date(),
            lastPull: null
          },
          limits: {
            osirion: {
              pullsPerMonth: pullsPerMonth,
              resetsMonthly: true,
              description: `Osirion API pulls per month (${userData.subscriptionTier || 'free'} tier)`
            }
          },
          message: 'Usage tracking initialized for new user'
        });
      }
    } catch (firebaseError) {
      console.error('❌ Error checking usage:', firebaseError);
      return NextResponse.json({
        success: false,
        error: 'Failed to check usage',
        details: (firebaseError as Error).message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error in usage check API:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: (error as Error).message
    }, { status: 500 });
  }
}
