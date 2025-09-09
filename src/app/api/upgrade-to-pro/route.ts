import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin-api';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    console.log(`🎯 Upgrading user ${userId} to Pro tier after successful payment...`);
    
    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: 'Firebase not initialized' }, { status: 500 });
    }

    // Get current user data to preserve existing information
    const userDoc = await db.collection('users').doc(userId).get();
    const currentData = userDoc.exists ? userDoc.data() : {};

    // Force update user document with Pro subscription
    const updateData = {
      subscriptionTier: 'pro',
      subscriptionStatus: 'active',
      accountType: 'pro',
      subscription: {
        ...currentData?.subscription,
        status: 'active',
        tier: 'pro',
        plan: 'pro',
        startDate: new Date(),
        endDate: null,
        autoRenew: true,
        paymentMethod: 'stripe'
      },
      credits: 4000,
      credits_total: 4000,
      credits_remaining: 4000,
      credits_used: 0,
      last_updated: new Date(),
      updatedAt: new Date()
    };

    await db.collection('users').doc(userId).update(updateData);
    console.log(`✅ Updated user ${userId} to Pro tier`);

    // Update or create subscription document
    const subscriptionsSnapshot = await db.collection('subscriptions')
      .where('userId', '==', userId)
      .get();
    
    const subscriptionData = {
      userId,
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
      createdAt: subscriptionsSnapshot.empty ? new Date() : undefined,
      updatedAt: new Date()
    };
    
    if (!subscriptionsSnapshot.empty) {
      await subscriptionsSnapshot.docs[0].ref.update(subscriptionData);
      console.log(`✅ Updated existing subscription document for user ${userId}`);
    } else {
      await db.collection('subscriptions').add({
        ...subscriptionData,
        createdAt: new Date()
      });
      console.log(`✅ Created new subscription document for user ${userId}`);
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
      console.log(`✅ Updated existing usage document for user ${userId}`);
    } else {
      await db.collection('usage').add({
        ...usageData,
        createdAt: new Date()
      });
      console.log(`✅ Created new usage document for user ${userId}`);
    }

    // Log the upgrade
    await db.collection('webhookLogs').add({
      eventType: 'browser.upgrade.to.pro',
      userId,
      plan: 'pro',
      status: 'active',
      timestamp: new Date(),
      success: true,
      source: 'browser_payment_success',
      reason: 'User payment successful - immediately upgraded to Pro'
    });

    console.log(`🎉 Successfully upgraded user ${userId} to Pro tier`);

    return NextResponse.json({
      success: true,
      message: `Successfully upgraded user to Pro tier`,
      plan: 'pro',
      status: 'active',
      credits: 4000,
      collectionsUpdated: ['users', 'subscriptions', 'usage', 'webhookLogs'],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error upgrading to Pro:', error);
    return NextResponse.json({ 
      error: 'Failed to upgrade to Pro', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
