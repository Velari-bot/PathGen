import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Import the UsageTracker to get proper limits
import { UsageTracker } from '@/lib/usage-tracker';

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
        
        // Get the user's subscription tier (default to 'free' if not set)
        const subscriptionTier = userData?.subscriptionTier || 'free';
        
        // Map subscription tier names to match UsageTracker expectations
        const mappedTier = subscriptionTier === 'standard' ? 'paid' : subscriptionTier;
        
        // Use UsageTracker to get proper limits for the subscription tier
        const limits = UsageTracker.getLimitsForTier(mappedTier as 'free' | 'paid' | 'pro');
        
        // Map the limits to the expected format for the dashboard
        const dashboardLimits = {
          matches: { 
            monthly: limits.osirion.matchesPerMonth, 
            oneTime: limits.osirion.matchesPerMonth === -1 ? false : true 
          },
          aiMessages: { 
            monthly: limits.ai.messagesPerMonth, 
            oneTime: limits.ai.messagesPerMonth === -1 ? false : true 
          },
          replayUploads: { 
            monthly: limits.osirion.replayUploadsPerMonth, 
            oneTime: limits.osirion.replayUploadsPerMonth === -1 ? false : true 
          },
          computeRequests: { 
            monthly: limits.osirion.computeRequestsPerMonth, 
            oneTime: limits.osirion.computeRequestsPerMonth === -1 ? false : true 
          },
          osirionPulls: { 
            monthly: limits.osirion.matchesPerMonth, // Use matches as the main metric
            oneTime: limits.osirion.matchesPerMonth === -1 ? false : true 
          }
        };
        
        return NextResponse.json({
          success: true,
          usage: {
            userId: userId,
            currentMonth: currentMonth,
            osirionPulls: osirionPulls,
            osirionPullsRemaining: dashboardLimits.osirionPulls.monthly === -1 ? -1 : dashboardLimits.osirionPulls.monthly - osirionPulls,
            monthlyLimit: dashboardLimits.osirionPulls.monthly === -1 ? '∞' : dashboardLimits.osirionPulls.monthly,
            lastReset: lastReset,
            lastPull: usageData?.lastPull || null,
            // Add all usage metrics
            matches: {
              used: usageData?.matches || 0,
              limit: dashboardLimits.matches.monthly === -1 ? '∞' : dashboardLimits.matches.monthly,
              oneTime: dashboardLimits.matches.oneTime
            },
            aiMessages: {
              used: usageData?.aiMessages || 0,
              limit: dashboardLimits.aiMessages.monthly === -1 ? '∞' : dashboardLimits.aiMessages.monthly,
              oneTime: dashboardLimits.aiMessages.oneTime
            },
            replayUploads: {
              used: usageData?.replayUploads || 0,
              limit: dashboardLimits.replayUploads.monthly === -1 ? '∞' : dashboardLimits.replayUploads.monthly,
              oneTime: dashboardLimits.replayUploads.oneTime
            },
            computeRequests: {
              used: usageData?.computeRequests || 0,
              limit: dashboardLimits.computeRequests.monthly === -1 ? '∞' : dashboardLimits.computeRequests.monthly,
              oneTime: dashboardLimits.computeRequests.oneTime
            }
          },
          limits: {
            osirion: {
              pullsPerMonth: dashboardLimits.osirionPulls.monthly === -1 ? '∞' : dashboardLimits.osirionPulls.monthly,
              resetsMonthly: !dashboardLimits.osirionPulls.oneTime,
              description: `Osirion API pulls per month (${subscriptionTier} tier)`
            },
            matches: dashboardLimits.matches,
            aiMessages: dashboardLimits.aiMessages,
            replayUploads: dashboardLimits.replayUploads,
            computeRequests: dashboardLimits.computeRequests
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
        
        // Get the user's subscription tier (default to 'free' if not set)
        const subscriptionTier = userData?.subscriptionTier || 'free';
        
        // Map subscription tier names to match UsageTracker expectations
        const mappedTier = subscriptionTier === 'standard' ? 'paid' : subscriptionTier;
        
        // Use UsageTracker to get proper limits for the subscription tier
        const limits = UsageTracker.getLimitsForTier(mappedTier as 'free' | 'paid' | 'pro');
        
        // Map the limits to the expected format for the dashboard
        const dashboardLimits = {
          matches: { 
            monthly: limits.osirion.matchesPerMonth, 
            oneTime: limits.osirion.matchesPerMonth === -1 ? false : true 
          },
          aiMessages: { 
            monthly: limits.ai.messagesPerMonth, 
            oneTime: limits.ai.messagesPerMonth === -1 ? false : true 
          },
          replayUploads: { 
            monthly: limits.osirion.replayUploadsPerMonth, 
            oneTime: limits.osirion.replayUploadsPerMonth === -1 ? false : true 
          },
          computeRequests: { 
            monthly: limits.osirion.computeRequestsPerMonth, 
            oneTime: limits.osirion.computeRequestsPerMonth === -1 ? false : true 
          },
          osirionPulls: { 
            monthly: limits.osirion.matchesPerMonth, // Use matches as the main metric
            oneTime: limits.osirion.matchesPerMonth === -1 ? false : true 
          }
        };
        
        return NextResponse.json({
          success: true,
          usage: {
            userId: userId,
            currentMonth: currentMonth,
            osirionPulls: 0,
            osirionPullsRemaining: dashboardLimits.osirionPulls.monthly === -1 ? -1 : dashboardLimits.osirionPulls.monthly,
            monthlyLimit: dashboardLimits.osirionPulls.monthly === -1 ? '∞' : dashboardLimits.osirionPulls.monthly,
            lastReset: new Date(),
            lastPull: null,
            // Add all usage metrics
            matches: {
              used: 0,
              limit: dashboardLimits.matches.monthly === -1 ? '∞' : dashboardLimits.matches.monthly,
              oneTime: dashboardLimits.matches.oneTime
            },
            aiMessages: {
              used: 0,
              limit: dashboardLimits.aiMessages.monthly === -1 ? '∞' : dashboardLimits.aiMessages.monthly,
              oneTime: dashboardLimits.aiMessages.oneTime
            },
            replayUploads: {
              used: 0,
              limit: dashboardLimits.replayUploads.monthly === -1 ? '∞' : dashboardLimits.replayUploads.monthly,
              oneTime: dashboardLimits.replayUploads.oneTime
            },
            computeRequests: {
              used: 0,
              limit: dashboardLimits.computeRequests.monthly === -1 ? '∞' : dashboardLimits.computeRequests.monthly,
              oneTime: dashboardLimits.computeRequests.oneTime
            }
          },
          limits: {
            osirion: {
              pullsPerMonth: dashboardLimits.osirionPulls.monthly === -1 ? '∞' : dashboardLimits.osirionPulls.monthly,
              resetsMonthly: !dashboardLimits.osirionPulls.oneTime,
              description: `Osirion API pulls per month (${subscriptionTier} tier)`
            },
            matches: dashboardLimits.matches,
            aiMessages: dashboardLimits.aiMessages,
            replayUploads: dashboardLimits.replayUploads,
            computeRequests: dashboardLimits.computeRequests
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
