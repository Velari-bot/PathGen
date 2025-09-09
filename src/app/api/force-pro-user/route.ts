import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin-api';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    console.log(`🔧 Force fixing Pro subscription for user: ${userId}`);
    
    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: 'Firebase not initialized' }, { status: 500 });
    }

    // Force update user document with Pro subscription
    await db.collection('users').doc(userId).update({
      subscriptionTier: 'pro',
      subscriptionStatus: 'active',
      accountType: 'pro',
      subscription: {
        status: 'active',
        tier: 'pro',
        plan: 'pro',
        startDate: new Date(),
        endDate: null,
        autoRenew: true,
        paymentMethod: 'stripe',
        stripeCustomerId: 'cus_T1Zeif3xGPSVqw', // From the console logs
        stripeSubscriptionId: 'sub_1S5WVCCitWuvPenEYZcAxQfO' // From the console logs
      },
      credits: 4000,
      credits_total: 4000,
      credits_remaining: 4000,
      credits_used: 0,
      last_updated: new Date(),
      updatedAt: new Date()
    });

    // Update or create subscription document
    const subscriptionsSnapshot = await db.collection('subscriptions')
      .where('userId', '==', userId)
      .get();
    
    const subscriptionData = {
      userId,
      stripeCustomerId: 'cus_T1Zeif3xGPSVqw',
      stripeSubscriptionId: 'sub_1S5WVCCitWuvPenEYZcAxQfO',
      plan: 'pro',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      cancelAtPeriodEnd: false,
      limits: {
        monthlyMessages: 1000,
        monthlyTokens: 100000,
        monthlyDataPulls: 500,
        replayUploads: 50,
        tournamentStrategies: 100,
        prioritySupport: true,
        advancedAnalytics: true
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
    
    if (!subscriptionsSnapshot.empty) {
      await subscriptionsSnapshot.docs[0].ref.update(subscriptionData);
      console.log(`✅ Updated existing subscription document`);
    } else {
      await db.collection('subscriptions').add(subscriptionData);
      console.log(`✅ Created new subscription document`);
    }

    // Update or create usage document
    const usageSnapshot = await db.collection('usage')
      .where('userId', '==', userId)
      .get();

    const usageData = {
      userId,
      subscriptionTier: 'pro',
      totalCredits: 4000,
      usedCredits: 0,
      availableCredits: 4000,
      lastReset: new Date(),
      updatedAt: new Date()
    };

    if (!usageSnapshot.empty) {
      await usageSnapshot.docs[0].ref.update(usageData);
      console.log(`✅ Updated existing usage document`);
    } else {
      await db.collection('usage').add({
        ...usageData,
        createdAt: new Date()
      });
      console.log(`✅ Created new usage document`);
    }

    // Add webhook log entry for this manual fix
    await db.collection('webhookLogs').add({
      eventType: 'manual.force.pro.fix',
      userId,
      plan: 'pro',
      status: 'active',
      timestamp: new Date(),
      success: true,
      manual: true,
      reason: 'Force fix Pro subscription for paid user',
      priceId: 'manual_fix',
      subscriptionId: 'sub_1S5WVCCitWuvPenEYZcAxQfO'
    });

    console.log(`✅ Force Pro fix completed for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: `Successfully forced Pro subscription for user ${userId}`,
      plan: 'pro',
      status: 'active',
      collectionsUpdated: ['users', 'subscriptions', 'usage', 'webhookLogs'],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error forcing Pro subscription:', error);
    return NextResponse.json({ 
      error: 'Failed to force Pro subscription', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
