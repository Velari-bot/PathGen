import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionManager } from '@/lib/subscription-manager';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log(`🔧 Manually setting user ${userId} to PRO subscription`);

    // Use the robust subscription manager
    const result = await SubscriptionManager.updateSubscription({
      userId,
      tier: 'pro',
      status: 'active',
      stripeCustomerId: 'manual_fix',
      stripeSubscriptionId: 'manual_fix',
      startDate: new Date(),
      autoRenew: true
    });

    if (!result.success) {
      console.error('❌ Failed to update subscription:', result.errors);
      return NextResponse.json(
        { 
          error: 'Failed to update subscription', 
          details: result.errors,
          updatedFields: result.updatedFields 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully updated user ${userId} to PRO subscription`,
      plan: 'pro',
      updatedFields: result.updatedFields,
      timestamp: result.timestamp.toISOString()
    });

  } catch (error: any) {
    console.error('Error manually fixing user subscription:', error);
    return NextResponse.json(
      { error: 'Failed to manually fix user subscription', details: error.message },
      { status: 500 }
    );
  }
}
