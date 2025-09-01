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
    } else {
      await db.collection('usage').add({
        userId,
        ...usageData,
        createdAt: new Date()
      });
    }

    // Also update subscriptions collection if it exists
    const subscriptionsSnapshot = await db.collection('subscriptions')
      .where('userId', '==', userId)
      .get();

    if (!subscriptionsSnapshot.empty) {
      await subscriptionsSnapshot.docs[0].ref.update({
        plan,
        status: 'active',
        updatedAt: new Date()
      });
    }

    console.log(`✅ Successfully updated user ${userId} to ${plan} tier`);

    return NextResponse.json({
      success: true,
      message: `User subscription updated to ${plan}`,
      subscriptionTier: plan,
      foundProSubscription
    });

  } catch (error: any) {
    console.error('Error force fixing subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fix subscription', details: error.message },
      { status: 500 }
    );
  }
}
