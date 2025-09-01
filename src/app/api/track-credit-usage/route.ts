import { NextRequest, NextResponse } from 'next/server';
import { CreditTracker } from '@/lib/credit-system';

export async function POST(request: NextRequest) {
  try {
    const { userId, feature, metadata, sessionId } = await request.json();

    if (!userId || !feature) {
      return NextResponse.json({ 
        error: 'User ID and feature are required' 
      }, { status: 400 });
    }

    console.log(`💰 Tracking credit usage for user ${userId}, feature: ${feature}`);

    // Track credit usage immediately
    const result = await CreditTracker.trackCreditUsage(userId, feature, metadata, sessionId);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to track credit usage',
        availableCredits: result.availableCredits
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      availableCredits: result.availableCredits,
      message: `Credit usage tracked for ${feature}`
    });

  } catch (error) {
    console.error('Error tracking credit usage:', error);
    return NextResponse.json(
      { 
        error: 'Failed to track credit usage', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
