import { NextRequest, NextResponse } from 'next/server';
import { OsirionService, UsageTracker, SUBSCRIPTION_TIERS } from '@/lib/osirion';

export async function POST(request: NextRequest) {
  try {
    const { userId, computeType, data } = await request.json();

    if (!userId || !computeType) {
      return NextResponse.json({ 
        error: 'Missing required fields: userId or computeType' 
      }, { status: 400 });
    }

    // Check user's subscription tier
    const userTier = 'free' as keyof typeof SUBSCRIPTION_TIERS; // Would come from database
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
