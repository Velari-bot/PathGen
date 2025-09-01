import { NextRequest, NextResponse } from 'next/server';
import { CreditTracker } from '@/lib/credit-system';

export async function POST(request: NextRequest) {
  try {
    const { userId, feature, sessionId } = await request.json();

    if (!userId || !feature || !sessionId) {
      return NextResponse.json({ 
        error: 'User ID, feature, and session ID are required' 
      }, { status: 400 });
    }

    console.log(`💸 Refunding credits for user ${userId}, feature: ${feature}`);

    // Refund credits
    const result = await CreditTracker.refundCredits(userId, feature, sessionId);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to refund credits',
        availableCredits: result.availableCredits
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      availableCredits: result.availableCredits,
      message: `Credits refunded for ${feature}`
    });

  } catch (error) {
    console.error('Error refunding credits:', error);
    return NextResponse.json(
      { 
        error: 'Failed to refund credits', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
