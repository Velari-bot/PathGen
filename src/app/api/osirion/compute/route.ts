import { NextRequest, NextResponse } from 'next/server';
import { OsirionService, UsageTracker, SUBSCRIPTION_TIERS } from '@/lib/osirion';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const { userId, computeType, data } = await request.json();

    if (!userId || !computeType) {
      return NextResponse.json({ 
        error: 'Missing required fields: userId or computeType' 
      }, { status: 400 });
    }

    // Initialize Firebase Admin if not already initialized
    if (getApps().length === 0) {
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
    
    // Get user's actual subscription tier from database
    let userTier: keyof typeof SUBSCRIPTION_TIERS = 'free';
    try {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        const subscriptionTier = userData?.subscriptionTier || 'free';
        // Map subscription tier names to match SUBSCRIPTION_TIERS expectations
        userTier = subscriptionTier === 'standard' ? 'paid' : subscriptionTier;
      }
    } catch (error) {
      console.warn('Could not get user subscription tier, defaulting to free:', error);
    }
    
    const limits = SUBSCRIPTION_TIERS[userTier].limits;

    // Check if user can make compute requests
    if (limits.osirion.computeRequestsPerMonth === 0) {
      return NextResponse.json({
        success: false,
        blocked: true,
        message: 'Compute requests not available on free tier',
        upgradeRequired: true,
        suggestion: 'Upgrade to access advanced analytics and AI-powered insights'
      });
    }

    // Check current usage
    const currentUsage = await UsageTracker.checkUsage(userId, userTier);
    
    if (limits.osirion.computeRequestsPerMonth !== -1 && 
        currentUsage.osirion.computeRequestsUsed >= limits.osirion.computeRequestsPerMonth) {
      return NextResponse.json({
        success: false,
        blocked: true,
        message: 'Monthly compute request limit reached',
        upgradeRequired: true,
        currentUsage: currentUsage.osirion.computeRequestsUsed,
        limit: limits.osirion.computeRequestsPerMonth,
        suggestion: 'Upgrade to access unlimited compute requests'
      });
    }

    const osirionService = new OsirionService();
    
    try {
      // Request compute from Osirion
      const computeRequest = await osirionService.requestCompute(computeType, data);
      
      if (!computeRequest) {
        return NextResponse.json({
          success: false,
          error: 'Failed to request compute from Osirion'
        });
      }

      // Increment usage counter
      await UsageTracker.incrementUsage(userId, 'computeRequests');

      return NextResponse.json({
        success: true,
        computeRequest,
        usage: {
          current: currentUsage.osirion.computeRequestsUsed + 1,
          limit: limits.osirion.computeRequestsPerMonth,
          resetDate: currentUsage.resetDate
        }
      });

    } catch (computeError) {
      console.error('Compute request error:', computeError);
      return NextResponse.json({ 
        success: false,
        error: 'Failed to request compute',
        details: (computeError as Error).message
      });
    }

  } catch (error) {
    console.error('Error in compute request API:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: (error as Error).message
    }, { status: 500 });
  }
}
