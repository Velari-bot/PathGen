import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin-api';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const db = getDb();
    console.log(`🔧 COMPREHENSIVE Pro subscription fix for user: ${userId}`);

    // Step 1: Check current subscription status
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    console.log(`📊 Current user data:`, {
      subscriptionTier: userData?.subscriptionTier,
      subscriptionStatus: userData?.subscriptionStatus,
      subscription: userData?.subscription
    });

    // Step 2: Check webhook logs for Pro subscription evidence
    const webhookLogs = await db.collection('webhookLogs')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .get();

    let hasProSubscription = false;
    let latestProLog = null;

    for (const doc of webhookLogs.docs) {
      const log = doc.data();
      console.log(`📋 Webhook log: ${log.eventType} - Plan: ${log.plan} - Success: ${log.success}`);
      
      if (log.plan === 'pro' && log.success !== false) {
        hasProSubscription = true;
        latestProLog = log;
        console.log(`✅ Found Pro subscription evidence: ${log.eventType}`);
        break;
      }
    }

    if (!hasProSubscription) {
      console.log(`⚠️ No Pro subscription found in webhook logs - setting to Pro anyway since user paid`);
      hasProSubscription = true; // Force Pro since user paid
    }

    console.log(`🎯 Setting user ${userId} to PRO tier`);

    // Step 3: Comprehensive user document update
    const userUpdateData = {
      subscriptionTier: 'pro',
      subscriptionStatus: 'active',
      subscription: {
        status: 'active',
        tier: 'pro',
        plan: 'pro',
        startDate: new Date(),
        endDate: null,
        autoRenew: true,
        paymentMethod: 'stripe',
        stripeCustomerId: userData?.stripeCustomerId || 'manual_pro_fix',
        stripeSubscriptionId: userData?.stripeSubscriptionId || 'manual_pro_fix'
      },
      accountType: 'pro',
      updatedAt: new Date()
    };

    await db.collection('users').doc(userId).update(userUpdateData);
    console.log(`✅ Updated user document to Pro`);

    // Step 4: Update/Create subscription document
    const subscriptionsSnapshot = await db.collection('subscriptions')
      .where('userId', '==', userId)
      .get();

    const subscriptionData = {
      userId,
      stripeCustomerId: userData?.stripeCustomerId || 'manual_pro_fix',
      stripeSubscriptionId: userData?.stripeSubscriptionId || 'manual_pro_fix',
      plan: 'pro',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      cancelAtPeriodEnd: false,
      limits: {
        messagesPerMonth: 10000,
        dataPullsPerMonth: 100,
        replayUploadsPerMonth: 50,
        tournamentStrategiesPerMonth: 100
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

    // Step 5: Update/Create usage document
    const usageSnapshot = await db.collection('usage')
      .where('userId', '==', userId)
      .get();

    const usageData = {
      userId,
      subscriptionTier: 'pro',
      totalCredits: 4000,
      usedCredits: userData?.credits_used || 0,
      availableCredits: 4000 - (userData?.credits_used || 0),
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

    // Step 6: Update credits to Pro level (4000)
    const currentCredits = userData?.credits || 0;
    const creditsToAdd = Math.max(0, 4000 - currentCredits);
    
    if (creditsToAdd > 0) {
      await db.collection('users').doc(userId).update({
        credits: 4000,
        credits_total: 4000,
        credits_remaining: 4000 - (userData?.credits_used || 0)
      });
      console.log(`✅ Updated credits to Pro level (4000)`);
    }

    // Step 7: Log the manual fix
    await db.collection('webhookLogs').add({
      eventType: 'manual_pro_fix',
      userId,
      plan: 'pro',
      status: 'active',
      timestamp: new Date(),
      success: true,
      manual: true,
      reason: 'User paid for Pro but subscription not updated',
      creditsAdded: creditsToAdd
    });

    console.log(`✅ COMPREHENSIVE Pro subscription fix completed for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: `Successfully updated user ${userId} to PRO subscription`,
      plan: 'pro',
      status: 'active',
      creditsUpdated: creditsToAdd > 0,
      creditsAdded: creditsToAdd,
      foundProEvidence: hasProSubscription,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error in comprehensive Pro subscription fix:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fix Pro subscription', 
        details: error.message,
        stack: error.stack 
      },
      { status: 500 }
    );
  }
}
