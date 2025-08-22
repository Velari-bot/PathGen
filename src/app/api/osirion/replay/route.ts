import { NextRequest, NextResponse } from 'next/server';
import { OsirionService, UsageTracker, SUBSCRIPTION_TIERS } from '@/lib/osirion';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const matchId = formData.get('matchId') as string;
    const userId = formData.get('userId') as string;
    const replayFile = formData.get('replay') as File;

    if (!matchId || !userId || !replayFile) {
      return NextResponse.json({ 
        error: 'Missing required fields: matchId, userId, or replay file' 
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

    // Check if user can upload replays
    if (limits.osirion.replayUploadsPerMonth === 0) {
      return NextResponse.json({
        success: false,
        blocked: true,
        message: 'Replay uploads not available on free tier',
        upgradeRequired: true,
        suggestion: 'Upgrade to upload and analyze replay files'
      });
    }

    // Check current usage
    const currentUsage = await UsageTracker.checkUsage(userId, userTier);
    
    if (limits.osirion.replayUploadsPerMonth !== -1 && 
        currentUsage.osirion.replayUploadsUsed >= limits.osirion.replayUploadsPerMonth) {
      return NextResponse.json({
        success: false,
        blocked: true,
        message: 'Monthly replay upload limit reached',
        upgradeRequired: true,
        currentUsage: currentUsage.osirion.replayUploadsUsed,
        limit: limits.osirion.replayUploadsPerMonth,
        suggestion: 'Upgrade to upload more replay files per month'
      });
    }

    const osirionService = new OsirionService();
    
    try {
      // Upload replay to Osirion
      const upload = await osirionService.uploadReplay(matchId, replayFile);
      
      if (!upload) {
        return NextResponse.json({
          success: false,
          error: 'Failed to upload replay to Osirion'
        });
      }

      // Increment usage counter
      await UsageTracker.incrementUsage(userId, 'replayUploads');

      return NextResponse.json({
        success: true,
        upload,
        usage: {
          current: currentUsage.osirion.replayUploadsUsed + 1,
          limit: limits.osirion.replayUploadsPerMonth,
          resetDate: currentUsage.resetDate
        }
      });

    } catch (uploadError) {
      console.error('Replay upload error:', uploadError);
      return NextResponse.json({ 
        success: false,
        error: 'Failed to upload replay',
        details: (uploadError as Error).message
      });
    }

  } catch (error) {
    console.error('Error in replay upload API:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: (error as Error).message
    }, { status: 500 });
  }
}
