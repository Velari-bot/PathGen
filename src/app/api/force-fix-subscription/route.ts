import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin-api';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const db = getDb();
    console.log(`🔧 Force fixing subscription for user: ${userId}`);

    // Get ALL webhook logs for this user to find the latest pro subscription
    const webhookLogs = await db.collection('webhookLogs')
      .where('userId', '==', userId)
      .get();

    let plan = 'free';
    let foundProSubscription = false;

    // Look through all webhook logs to find any pro subscription
    for (const doc of webhookLogs.docs) {
      const log = doc.data();
      console.log(`📋 Checking webhook log: ${log.eventType} with plan: ${log.plan}`);
      
      if (log.plan === 'pro' && log.success !== false) {
        plan = 'pro';
        foundProSubscription = true;
        console.log(`✅ Found pro subscription in webhook log: ${log.eventType}`);
        break;
      }
    }

    if (!foundProSubscription) {
      console.log(`⚠️ No pro subscription found in webhook logs for user ${userId}`);
    }

    console.log(`🎯 Setting user ${userId} to ${plan} tier based on webhook logs`);

    // Force update user document
    await db.collection('users').doc(userId).update({
      subscriptionTier: plan,
      'subscription.tier': plan,
      'subscription.plan': plan,
      'subscription.status': 'active',
      subscriptionStatus: 'active',
      updatedAt: new Date()
    });

    // Force update usage document
    const usageSnapshot = await db.collection('usage')
      .where('userId', '==', userId)
      .get();

    const usageData = {
      subscriptionTier: plan,
      totalCredits: plan === 'pro' ? 4000 : 250,
      availableCredits: plan === 'pro' ? 4000 : 250,
      updatedAt: new Date()
    };

    if (!usageSnapshot.empty) {
      await usageSnapshot.docs[0].ref.update(usageData);
      console.log(`✅ Force updated usage document for ${userId} to ${plan} tier`);
    } else {
      // Create usage document if it doesn't exist
      await db.collection('usage').add({
        userId,
        ...usageData,
        usedCredits: 0,
        lastReset: new Date()
      });
      console.log(`✅ Created usage document for ${userId} with ${plan} tier`);
    }

    // Log the force fix
    await db.collection('webhookLogs').add({
      eventType: 'force.subscription.fix',
      userId,
      plan,
      status: 'active',
      timestamp: new Date(),
      success: true,
      message: `Force fixed subscription for user ${userId} to ${plan} tier based on webhook logs`,
      foundProSubscription
    });

    return NextResponse.json({
      success: true,
      message: `Force updated user ${userId} to ${plan} tier based on webhook logs`,
      plan,
      foundProSubscription,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error force fixing user subscription:', error);
    return NextResponse.json(
      { error: 'Failed to force fix user subscription', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
