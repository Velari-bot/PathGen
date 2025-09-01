import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionManager } from '@/lib/subscription-manager';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log(`🔍 Checking subscription consistency for user: ${userId}`);

    // Get current subscription status
    const status = await SubscriptionManager.getSubscriptionStatus(userId);
    
    if (!status) {
      return NextResponse.json({ 
        error: 'User not found',
        userId 
      }, { status: 404 });
    }

    // Check if consistency is needed
    const result = await SubscriptionManager.ensureConsistency(userId);

    return NextResponse.json({
      success: result.success,
      currentStatus: status,
      consistencyCheck: {
        success: result.success,
        updatedFields: result.updatedFields,
        errors: result.errors,
        timestamp: result.timestamp
      },
      message: result.success 
        ? 'Subscription consistency verified/restored'
        : 'Failed to ensure subscription consistency'
    });

  } catch (error) {
    console.error('Error checking subscription consistency:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check subscription consistency', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
