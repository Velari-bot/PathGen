import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin-api';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const db = getDb();
    console.log(`🔧 Manually fixing subscription for user: ${userId}`);

    // Get the user's subscription from webhookLogs to see what plan they should have
    const webhookLogs = await db.collection('webhookLogs')
      .where('userId', '==', userId)
      .where('success', '==', true)
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    let plan = 'free';
    if (!webhookLogs.empty) {
      const latestLog = webhookLogs.docs[0].data();
      plan = latestLog.plan || 'free';
      console.log(`📋 Found latest webhook log: ${latestLog.eventType} with plan: ${plan}`);
    }

    // Update user document with comprehensive subscription data
    const subscriptionData = {
      subscription: {
        status: 'active',
        tier: plan,
        plan: plan,
        startDate: new Date(),
        endDate: null,
        autoRenew: true,
        paymentMethod: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null
      },
      subscriptionStatus: 'active',
      subscriptionTier: plan,
      updatedAt: new Date()
    };

    await db.collection('users').doc(userId).update(subscriptionData);
    console.log(`✅ Updated user document for ${userId} to ${plan} tier`);

    // Update usage document
    const usageData = {
      userId,
      subscriptionTier: plan,
      totalCredits: plan === 'pro' ? 4000 : 250,
      usedCredits: 0,
      availableCredits: plan === 'pro' ? 4000 : 250,
      lastReset: new Date(),
      updatedAt: new Date()
    };

    const usageSnapshot = await db.collection('usage')
      .where('userId', '==', userId)
      .get();

    if (!usageSnapshot.empty) {
      await usageSnapshot.docs[0].ref.update(usageData);
      console.log(`✅ Updated usage document for ${userId}`);
    } else {
      await db.collection('usage').add(usageData);
      console.log(`✅ Created usage document for ${userId}`);
    }

    // Update subscriptions collection
    const subscriptionDoc = {
      userId,
      plan,
      status: 'active',
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      cancelAtPeriodEnd: false,
      limits: plan === 'pro' ? {
        monthlyMessages: 1000,
        monthlyTokens: 100000,
        monthlyDataPulls: 500,
        replayUploads: 50,
        tournamentStrategies: 100,
        prioritySupport: true,
        advancedAnalytics: true
      } : {
        monthlyMessages: 10,
        monthlyTokens: 1000,
        monthlyDataPulls: 5,
        replayUploads: 0,
        tournamentStrategies: 0,
        prioritySupport: false,
        advancedAnalytics: false
      },
      usage: {
        messagesUsed: 0,
        tokensUsed: 0,
        dataPullsUsed: 0,
        replayUploadsUsed: 0,
        tournamentStrategiesUsed: 0,
        resetDate: new Date()
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const subscriptionsSnapshot = await db.collection('subscriptions')
      .where('userId', '==', userId)
      .get();

    if (!subscriptionsSnapshot.empty) {
      await subscriptionsSnapshot.docs[0].ref.update(subscriptionDoc);
      console.log(`✅ Updated subscription document for ${userId}`);
    } else {
      await db.collection('subscriptions').add(subscriptionDoc);
      console.log(`✅ Created subscription document for ${userId}`);
    }

    // Log the manual fix
    await db.collection('webhookLogs').add({
      eventType: 'manual.subscription.fix',
      userId,
      plan,
      status: 'active',
      timestamp: new Date(),
      success: true,
      message: `Manually fixed subscription for user ${userId} to ${plan} tier`
    });

    return NextResponse.json({
      success: true,
      message: `Successfully updated user ${userId} to ${plan} tier across all collections`,
      plan,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fixing user subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fix user subscription', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
