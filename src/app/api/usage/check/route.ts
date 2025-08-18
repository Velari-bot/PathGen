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
        
        // Determine limits based on subscription tier - Credit-Efficient Limits
        let limits = {
          matches: { monthly: 6, oneTime: true },
          aiMessages: { monthly: 45, oneTime: true },
          replayUploads: { monthly: 0, oneTime: false },
          computeRequests: { monthly: 0, oneTime: false },
          osirionPulls: { monthly: 10, oneTime: false }
        };
        
        if (userData.subscriptionTier === 'standard') {
          limits = {
            matches: { monthly: 45, oneTime: false }, // 45 matches/month (≈1000 credits = ~€2 worth, safe)
            aiMessages: { monthly: 225, oneTime: false }, // 225 messages/month (light weight on API)
            replayUploads: { monthly: 5, oneTime: false }, // 5 × 20 credits = 100 credits ≈ €0.20
            computeRequests: { monthly: 50, oneTime: false }, // 50 × 10 credits = 500 credits ≈ €1
            osirionPulls: { monthly: 50, oneTime: false } // 50 pulls/month
          };
        } else if (userData.subscriptionTier === 'pro') {
          limits = {
            matches: { monthly: 225, oneTime: false }, // 225 matches/month (≈5000 credits = ~€10)
            aiMessages: { monthly: 650, oneTime: false }, // 650 messages/month
            replayUploads: { monthly: 175, oneTime: false }, // 175 × 20 credits = 3500 credits = ~€7
            computeRequests: { monthly: 275, oneTime: false }, // 275 × 10 credits = 2750 credits = ~€5.5
            osirionPulls: { monthly: 500, oneTime: false } // 500 pulls/month
          };
        }
        
        return NextResponse.json({
          success: true,
          usage: {
            userId: userId,
            currentMonth: currentMonth,
            osirionPulls: osirionPulls,
            osirionPullsRemaining: limits.osirionPulls.monthly - osirionPulls,
            monthlyLimit: limits.osirionPulls.monthly,
            lastReset: lastReset,
            lastPull: usageData?.lastPull || null,
            // Add all usage metrics
            matches: {
              used: usageData?.matches || 0,
              limit: limits.matches.monthly,
              oneTime: limits.matches.oneTime
            },
            aiMessages: {
              used: usageData?.aiMessages || 0,
              limit: limits.aiMessages.monthly,
              oneTime: limits.aiMessages.oneTime
            },
            replayUploads: {
              used: usageData?.replayUploads || 0,
              limit: limits.replayUploads.monthly,
              oneTime: limits.replayUploads.oneTime
            },
            computeRequests: {
              used: usageData?.computeRequests || 0,
              limit: limits.computeRequests.monthly,
              oneTime: limits.computeRequests.oneTime
            }
          },
          limits: {
            osirion: {
              pullsPerMonth: limits.osirionPulls.monthly,
              resetsMonthly: !limits.osirionPulls.oneTime,
              description: `Osirion API pulls per month (${userData.subscriptionTier || 'free'} tier)`
            },
            matches: limits.matches,
            aiMessages: limits.aiMessages,
            replayUploads: limits.replayUploads,
            computeRequests: limits.computeRequests
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
        
        // Determine limits based on subscription tier - Credit-Efficient Limits
        let limits = {
          matches: { monthly: 6, oneTime: true },
          aiMessages: { monthly: 45, oneTime: true },
          replayUploads: { monthly: 0, oneTime: false },
          computeRequests: { monthly: 0, oneTime: false },
          osirionPulls: { monthly: 10, oneTime: false }
        };
        
        if (userData.subscriptionTier === 'standard') {
          limits = {
            matches: { monthly: 45, oneTime: false }, // 45 matches/month (≈1000 credits = ~€2 worth, safe)
            aiMessages: { monthly: 225, oneTime: false }, // 225 messages/month (light weight on API)
            replayUploads: { monthly: 5, oneTime: false }, // 5 × 20 credits = 100 credits ≈ €0.20
            computeRequests: { monthly: 50, oneTime: false }, // 50 × 10 credits = 500 credits ≈ €1
            osirionPulls: { monthly: 50, oneTime: false } // 50 pulls/month
          };
        } else if (userData.subscriptionTier === 'pro') {
          limits = {
            matches: { monthly: 225, oneTime: false }, // 225 matches/month (≈5000 credits = ~€10)
            aiMessages: { monthly: 650, oneTime: false }, // 650 messages/month
            replayUploads: { monthly: 175, oneTime: false }, // 175 × 20 credits = 3500 credits = ~€7
            computeRequests: { monthly: 275, oneTime: false }, // 275 × 10 credits = 2750 credits = ~€5.5
            osirionPulls: { monthly: 500, oneTime: false } // 500 pulls/month
          };
        }
        
        return NextResponse.json({
          success: true,
          usage: {
            userId: userId,
            currentMonth: currentMonth,
            osirionPulls: 0,
            osirionPullsRemaining: limits.osirionPulls.monthly,
            monthlyLimit: limits.osirionPulls.monthly,
            lastReset: new Date(),
            lastPull: null,
            // Add all usage metrics
            matches: {
              used: 0,
              limit: limits.matches.monthly,
              oneTime: limits.matches.oneTime
            },
            aiMessages: {
              used: 0,
              limit: limits.aiMessages.monthly,
              oneTime: limits.aiMessages.oneTime
            },
            replayUploads: {
              used: 0,
              limit: limits.replayUploads.monthly,
              oneTime: limits.replayUploads.oneTime
            },
            computeRequests: {
              used: 0,
              limit: limits.computeRequests.monthly,
              oneTime: limits.computeRequests.oneTime
            }
          },
          limits: {
            osirion: {
              pullsPerMonth: limits.osirionPulls.monthly,
              resetsMonthly: !limits.osirionPulls.oneTime,
              description: `Osirion API pulls per month (${userData.subscriptionTier || 'free'} tier)`
            },
            matches: limits.matches,
            aiMessages: limits.aiMessages,
            replayUploads: limits.replayUploads,
            computeRequests: limits.computeRequests
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
