import { NextRequest, NextResponse } from 'next/server';
import { OsirionService, UsageTracker, SUBSCRIPTION_TIERS } from '@/lib/osirion';

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

    // Check user's subscription tier
    const userTier = 'free' as keyof typeof SUBSCRIPTION_TIERS; // Would come from database
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
