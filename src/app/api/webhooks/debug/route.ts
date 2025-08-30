import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const eventType = searchParams.get('eventType');
    const success = searchParams.get('success');

    let query = db.collection('webhookLogs').orderBy('timestamp', 'desc').limit(limit);

    if (eventType) {
      query = query.where('eventType', '==', eventType);
    }

    if (success !== null) {
      query = query.where('success', '==', success === 'true');
    }

    const snapshot = await query.get();
    const logs = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp
    }));

    // Get summary statistics
    const allLogsSnapshot = await db.collection('webhookLogs')
      .orderBy('timestamp', 'desc')
      .limit(1000)
      .get();

    const allLogs = allLogsSnapshot.docs.map((doc: any) => doc.data());
    
    const stats = {
      total: allLogs.length,
      successful: allLogs.filter((log: any) => log.success === true).length,
      failed: allLogs.filter((log: any) => log.success === false).length,
      byEventType: allLogs.reduce((acc: any, log: any) => {
        acc[log.eventType] = (acc[log.eventType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      recentFailures: allLogs
        .filter((log: any) => log.success === false)
        .slice(0, 10)
        .map((log: any) => ({
          eventType: log.eventType,
          error: log.error,
          timestamp: log.timestamp?.toDate?.() || log.timestamp
        }))
    };

    return NextResponse.json({
      success: true,
      logs,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching webhook logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhook logs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, subscriptionId, userId } = body;

    if (action === 'retry_subscription_update') {
      if (!subscriptionId || !userId) {
        return NextResponse.json(
          { error: 'subscriptionId and userId are required' },
          { status: 400 }
        );
      }

      // Get the subscription from Stripe
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      // Get the customer
      const customer = await stripe.customers.retrieve(subscription.customer);
      
      if (customer.deleted) {
        return NextResponse.json(
          { error: 'Customer was deleted' },
          { status: 400 }
        );
      }

      const plan = getPlanFromPriceId(subscription.items.data[0].price.id);
      const limits = getPlanLimits(plan);

      // Update subscription document
      await db.collection('subscriptions').doc(subscriptionId).set({
        userId,
        stripeCustomerId: subscription.customer,
        stripeSubscriptionId: subscriptionId,
        plan,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        limits,
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
      }, { merge: true });

      // Update user document
      await db.collection('users').doc(userId).update({
        'subscription.plan': plan,
        'subscription.status': subscription.status,
        'subscription.tier': plan,
        'subscription.stripeCustomerId': subscription.customer,
        'subscription.stripeSubscriptionId': subscriptionId,
        'subscription.currentPeriodStart': new Date(subscription.current_period_start * 1000),
        'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
        'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end,
        updatedAt: new Date()
      });

      // Log the manual retry
      await db.collection('webhookLogs').add({
        eventType: 'manual_retry',
        subscriptionId,
        userId,
        plan,
        status: subscription.status,
        timestamp: new Date(),
        success: true,
        manual: true
      });

      return NextResponse.json({
        success: true,
        message: `Successfully updated subscription ${subscriptionId} for user ${userId}`,
        plan,
        status: subscription.status
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in webhook debug action:', error);
    return NextResponse.json(
      { error: 'Failed to process action' },
      { status: 500 }
    );
  }
}

// Helper functions
function getPlanFromPriceId(priceId: string): string {
  const planMap: { [key: string]: string } = {
    'price_free': 'free',
    'price_pro': 'pro',
    'price_1RvsvqCitWuvPenEw9TefOig': 'pro' // PathGen Pro
  };
  return planMap[priceId] || 'free';
}

function getPlanLimits(plan: string) {
  const limits = {
    free: {
      monthlyMessages: 10,
      monthlyTokens: 1000,
      monthlyDataPulls: 5,
      replayUploads: 0,
      tournamentStrategies: 0,
      prioritySupport: false,
      advancedAnalytics: false
    },
    standard: {
      monthlyMessages: 100,
      monthlyTokens: 10000,
      monthlyDataPulls: 50,
      replayUploads: 5,
      tournamentStrategies: 10,
      prioritySupport: false,
      advancedAnalytics: true
    },
    pro: {
      monthlyMessages: 1000,
      monthlyTokens: 100000,
      monthlyDataPulls: 500,
      replayUploads: 50,
      tournamentStrategies: 100,
      prioritySupport: true,
      advancedAnalytics: true
    }
  };
  
  return limits[plan as keyof typeof limits] || limits.free;
}
