/**
 * PathGen Affiliate Webhook Handler
 * Processes Stripe webhooks for affiliate commission tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getDb } from '@/lib/firebase-admin-api';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(request: NextRequest) {
  const sig = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_AFFILIATE;

  if (!sig || !webhookSecret) {
    console.error('❌ Missing webhook signature or secret');
    return NextResponse.json({ error: 'Missing webhook signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  console.log(`📥 Received affiliate webhook: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(event.data.object as Stripe.Subscription);
        break;
      
      default:
        console.log(`🔄 Unhandled affiliate webhook event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Error processing affiliate webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

/**
 * Handle successful checkout completion
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log(`🎉 Checkout completed: ${session.id}`);
  
  const affiliateId = session.metadata?.affiliate_id;
  if (!affiliateId) {
    console.log('ℹ️ No affiliate tracking for this session');
    return;
  }

  try {
    // Get the subscription to access pricing details
    if (session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      const invoice = await stripe.invoices.retrieve(subscription.latest_invoice as string);
      
      await processAffiliateCommission({
        affiliateId,
        customerId: session.customer as string,
        subscriptionId: subscription.id,
        sessionId: session.id,
        amountTotal: invoice.amount_paid, // Amount in cents
        currency: invoice.currency,
        customerEmail: session.customer_details?.email,
        metadata: session.metadata
      });
    }
  } catch (error) {
    console.error('❌ Error processing affiliate commission:', error);
    
    // Log the error but don't fail the webhook
    const db = getDb();
    if (db) {
      await db.collection('affiliate_errors').add({
        type: 'commission_processing_failed',
        sessionId: session.id,
        affiliateId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });
    }
  }
}

/**
 * Handle successful payment (for recurring subscriptions)
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log(`💰 Payment succeeded: ${invoice.id}`);
  
  if (!invoice.subscription) {
    return; // Only process subscription payments
  }

  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
  const affiliateId = subscription.metadata?.affiliate_id;
  
  if (!affiliateId) {
    return; // No affiliate tracking
  }

  const db = getDb();
  if (!db) {
    console.error('❌ Database connection failed');
    return;
  }

  // Only process commission for first payment, not recurring payments
  const existingCommission = await db.collection('affiliate_earnings')
    .where('subscriptionId', '==', subscription.id)
    .limit(1)
    .get();

  if (!existingCommission.empty) {
    console.log('ℹ️ Commission already processed for this subscription');
    return;
  }

  await processAffiliateCommission({
    affiliateId,
    customerId: subscription.customer as string,
    subscriptionId: subscription.id,
    sessionId: invoice.id, // Use invoice ID as session reference
    amountTotal: invoice.amount_paid,
    currency: invoice.currency,
    customerEmail: invoice.customer_email,
    metadata: subscription.metadata
  });
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  console.log(`❌ Subscription cancelled: ${subscription.id}`);
  
  const affiliateId = subscription.metadata?.affiliate_id;
  if (!affiliateId) {
    return;
  }

  const db = getDb();
  if (!db) {
    console.error('❌ Database connection failed');
    return;
  }

  // Mark any pending earnings as cancelled if subscription is cancelled within grace period
  const gracePeriodDays = 30;
  const gracePeriodMs = gracePeriodDays * 24 * 60 * 60 * 1000;
  const now = Date.now();
  
  const earningsSnapshot = await db.collection('affiliate_earnings')
    .where('subscriptionId', '==', subscription.id)
    .where('status', '==', 'pending')
    .get();

  const batch = db.batch();
  
  earningsSnapshot.docs.forEach(doc => {
    const earning = doc.data();
    const createdAt = earning.createdAt instanceof Date 
      ? earning.createdAt.getTime()
      : earning.createdAt?.toMillis?.() || now;
    
    // Cancel earnings created within grace period
    if (now - createdAt < gracePeriodMs) {
      batch.update(doc.ref, {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: 'subscription_cancelled_within_grace_period'
      });
    }
  });

  if (!batch._delegate._committed) {
    await batch.commit();
  }
}

/**
 * Process affiliate commission for a successful purchase
 */
async function processAffiliateCommission(params: {
  affiliateId: string;
  customerId: string;
  subscriptionId: string;
  sessionId: string;
  amountTotal: number;
  currency: string;
  customerEmail?: string | null;
  metadata?: Record<string, string>;
}) {
  const {
    affiliateId,
    customerId,
    subscriptionId,
    sessionId,
    amountTotal,
    currency,
    customerEmail,
    metadata
  } = params;

  console.log(`💼 Processing affiliate commission for: ${affiliateId}`);

  const db = getDb();
  if (!db) {
    throw new Error('Database connection failed');
  }

  try {
    // Get affiliate details
    const affiliateDoc = await db.collection('affiliates').doc(affiliateId).get();
    if (!affiliateDoc.exists) {
      throw new Error(`Affiliate not found: ${affiliateId}`);
    }

    const affiliate = affiliateDoc.data()!;
    const commissionRate = affiliate.commissionRate || 0.15; // Default 15%
    const commissionAmount = Math.round(amountTotal * commissionRate);

    console.log(`💰 Commission calculation: ${amountTotal} * ${commissionRate} = ${commissionAmount} cents`);

    // Create affiliate earning record
    const earning = {
      affiliateId,
      customerId,
      subscriptionId,
      orderId: sessionId,
      amountEarned: commissionAmount,
      originalAmount: amountTotal,
      commissionRate,
      currency,
      status: 'pending',
      metadata: {
        customerEmail: customerEmail || 'unknown',
        referralCode: metadata?.referral_code || 'unknown',
        productName: 'PathGen Pro Subscription'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Use transaction to ensure data consistency
    await db.runTransaction(async (transaction) => {
      // Create earning record
      const earningRef = db.collection('affiliate_earnings').doc();
      transaction.set(earningRef, earning);

      // Update affiliate stats
      const affiliateRef = db.collection('affiliates').doc(affiliateId);
      const currentAffiliate = await transaction.get(affiliateRef);
      const currentData = currentAffiliate.data() || {};
      
      transaction.update(affiliateRef, {
        totalEarnings: (currentData.totalEarnings || 0) + commissionAmount,
        pendingEarnings: (currentData.pendingEarnings || 0) + commissionAmount,
        totalReferrals: (currentData.totalReferrals || 0) + 1,
        updatedAt: new Date()
      });

      // Create/update affiliate stats entry for analytics
      const today = new Date().toISOString().split('T')[0];
      const statsRef = db.collection('affiliate_stats').doc(`${affiliateId}_${today}`);
      const currentStats = await transaction.get(statsRef);
      
      if (currentStats.exists) {
        const statsData = currentStats.data() || {};
        transaction.update(statsRef, {
          conversions: (statsData.conversions || 0) + 1,
          totalEarnings: (statsData.totalEarnings || 0) + commissionAmount,
          updatedAt: new Date()
        });
      } else {
        transaction.set(statsRef, {
          affiliateId,
          period: 'daily',
          date: today,
          clicks: 0,
          conversions: 1,
          conversionRate: 0,
          totalEarnings: commissionAmount,
          averageOrderValue: amountTotal,
          topProducts: ['PathGen Pro'],
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    });

    console.log(`✅ Affiliate commission processed successfully for ${affiliateId}`);

  } catch (error) {
    console.error('❌ Error processing affiliate commission:', error);
    throw error;
  }
}
