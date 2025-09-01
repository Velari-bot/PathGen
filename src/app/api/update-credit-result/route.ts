import { NextRequest, NextResponse } from 'next/server';
import { CreditTracker } from '@/lib/credit-system';

export async function POST(request: NextRequest) {
  try {
    const { userId, feature, sessionId, success, finalMetadata } = await request.json();

    if (!userId || !feature || !sessionId) {
      return NextResponse.json({ 
        error: 'User ID, feature, and session ID are required' 
      }, { status: 400 });
    }

    console.log(`📝 Updating credit usage result for user ${userId}, feature: ${feature}, success: ${success}`);

    // Update credit usage result
    await CreditTracker.updateCreditUsageResult(userId, feature, sessionId, success, finalMetadata);

    return NextResponse.json({
      success: true,
      message: `Credit usage result updated for ${feature}`
    });

  } catch (error) {
    console.error('Error updating credit usage result:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update credit usage result', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
