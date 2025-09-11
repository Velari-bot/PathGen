/**
 * PathGen Affiliate System - Firebase Cloud Functions
 * Handles affiliate tracking, commission calculation, and payout management
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: '2023-10-16',
});

const db = admin.firestore();

/**
 * Generate a unique referral code for an affiliate
 */
function generateReferralCode(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Check if a referral code is unique
 */
async function isReferralCodeUnique(code: string): Promise<boolean> {
  const snapshot = await db.collection('affiliates')
    .where('referralCode', '==', code)
    .limit(1)
    .get();
  
  return snapshot.empty;
}

/**
 * Create a unique referral code
 */
async function createUniqueReferralCode(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const code = generateReferralCode();
    if (await isReferralCodeUnique(code)) {
      return code;
    }
    attempts++;
  }
  
  throw new Error('Failed to generate unique referral code');
}

/**
 * Cloud Function: Create Stripe Checkout Session with Affiliate Tracking
 */
export const createCheckoutSession = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { priceId, successUrl, cancelUrl, referralCode } = data;
  const userId = context.auth.uid;

  try {
    // Validate required fields
    if (!priceId) {
      throw new functions.https.HttpsError('invalid-argument', 'Price ID is required');
    }

    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data()!;
    let affiliateId: string | undefined;

    // Handle affiliate referral if provided
    if (referralCode) {
      console.log(`🔍 Processing referral code: ${referralCode}`);
      
      // Find the affiliate by referral code
      const affiliateSnapshot = await db.collection('affiliates')
        .where('referralCode', '==', referralCode.toUpperCase())
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (!affiliateSnapshot.empty) {
        const affiliate = affiliateSnapshot.docs[0].data();
        
        // Prevent self-referrals
        if (affiliate.userId === userId) {
          console.log(`⚠️ Self-referral attempt blocked for user: ${userId}`);
        } else {
          affiliateId = affiliateSnapshot.docs[0].id;
          console.log(`✅ Valid referral found. Affiliate ID: ${affiliateId}`);
          
          // Track the referral click/attempt
          await db.collection('affiliate_clicks').add({
            affiliateId,
            userId,
            referralCode: referralCode.toUpperCase(),
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            userAgent: context.rawRequest?.headers['user-agent'] || 'unknown',
            ipAddress: context.rawRequest?.ip || 'unknown'
          });
        }
      } else {
        console.log(`❌ Invalid or inactive referral code: ${referralCode}`);
      }
    }

    // Get or create Stripe customer
    let customerId = userData.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userData.email,
        name: userData.displayName || userData.email?.split('@')[0] || 'User',
        metadata: {
          userId,
          source: 'pathgen_affiliate_system'
        }
      });
      
      customerId = customer.id;
      
      // Update user with customer ID
      await db.collection('users').doc(userId).update({
        stripeCustomerId: customerId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // Create checkout session metadata
    const sessionMetadata: Record<string, string> = {
      userId,
      source: 'pathgen_affiliate_checkout'
    };

    // Add affiliate ID to metadata if referral exists
    if (affiliateId) {
      sessionMetadata.affiliate_id = affiliateId;
      sessionMetadata.referral_code = referralCode.toUpperCase();
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1
      }],
      mode: 'subscription',
      success_url: successUrl || `${functions.config().app.url}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${functions.config().app.url}/pricing?canceled=true`,
      metadata: sessionMetadata,
      subscription_data: {
        metadata: sessionMetadata
      },
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto'
      },
      allow_promotion_codes: true,
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60) // 30 minutes
    });

    console.log(`✅ Checkout session created: ${session.id}`);
    if (affiliateId) {
      console.log(`🎯 Affiliate tracking enabled for session: ${session.id}`);
    }

    return {
      sessionId: session.id,
      url: session.url!
    };

  } catch (error) {
    console.error('❌ Error creating checkout session:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to create checkout session');
  }
});

/**
 * Cloud Function: Handle Stripe Webhooks for Affiliate System
 */
export const handleStripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = functions.config().stripe.webhook_secret;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig!, endpointSecret);
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`📥 Received webhook: ${event.type}`);

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
        console.log(`🔄 Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    res.status(500).send('Webhook processing failed');
  }
});

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
    await db.collection('affiliate_errors').add({
      type: 'commission_processing_failed',
      sessionId: session.id,
      affiliateId,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
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
    const createdAt = earning.createdAt.toMillis();
    
    // Cancel earnings created within grace period
    if (now - createdAt < gracePeriodMs) {
      batch.update(doc.ref, {
        status: 'cancelled',
        cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
        cancellationReason: 'subscription_cancelled_within_grace_period'
      });
    }
  });

  await batch.commit();
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
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Use transaction to ensure data consistency
    await db.runTransaction(async (transaction) => {
      // Create earning record
      const earningRef = db.collection('affiliate_earnings').doc();
      transaction.set(earningRef, earning);

      // Update affiliate stats
      const affiliateRef = db.collection('affiliates').doc(affiliateId);
      transaction.update(affiliateRef, {
        totalEarnings: admin.firestore.FieldValue.increment(commissionAmount),
        pendingEarnings: admin.firestore.FieldValue.increment(commissionAmount),
        totalReferrals: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Create affiliate stats entry for analytics
      const today = new Date().toISOString().split('T')[0];
      const statsRef = db.collection('affiliate_stats').doc(`${affiliateId}_${today}`);
      
      transaction.set(statsRef, {
        affiliateId,
        period: 'daily',
        date: today,
        conversions: admin.firestore.FieldValue.increment(1),
        totalEarnings: admin.firestore.FieldValue.increment(commissionAmount),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    });

    console.log(`✅ Affiliate commission processed successfully for ${affiliateId}`);

    // Send notification to affiliate (optional)
    // await sendAffiliateNotification(affiliateId, commissionAmount);

  } catch (error) {
    console.error('❌ Error processing affiliate commission:', error);
    throw error;
  }
}

/**
 * Cloud Function: Register new affiliate
 */
export const registerAffiliate = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { email, displayName, paymentMethod, paymentDetails } = data;
  const userId = context.auth.uid;

  try {
    // Check if user is already an affiliate
    const existingAffiliate = await db.collection('affiliates')
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (!existingAffiliate.empty) {
      throw new functions.https.HttpsError('already-exists', 'User is already an affiliate');
    }

    // Generate unique referral code
    const referralCode = await createUniqueReferralCode();

    // Create affiliate record
    const affiliate = {
      userId,
      email,
      displayName,
      referralCode,
      totalEarnings: 0,
      pendingEarnings: 0,
      paidEarnings: 0,
      totalReferrals: 0,
      commissionRate: 0.15, // 15% default
      status: 'active',
      paymentInfo: {
        method: paymentMethod,
        details: paymentDetails
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const affiliateRef = await db.collection('affiliates').add(affiliate);

    console.log(`✅ New affiliate registered: ${affiliateRef.id} with code: ${referralCode}`);

    return {
      affiliateId: affiliateRef.id,
      referralCode,
      status: 'active'
    };

  } catch (error) {
    console.error('❌ Error registering affiliate:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to register affiliate');
  }
});

/**
 * Cloud Function: Get affiliate dashboard data
 */
export const getAffiliateDashboard = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;

  try {
    // Get affiliate data
    const affiliateSnapshot = await db.collection('affiliates')
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (affiliateSnapshot.empty) {
      throw new functions.https.HttpsError('not-found', 'Affiliate not found');
    }

    const affiliate = affiliateSnapshot.docs[0].data();
    const affiliateId = affiliateSnapshot.docs[0].id;

    // Get recent earnings
    const earningsSnapshot = await db.collection('affiliate_earnings')
      .where('affiliateId', '==', affiliateId)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const earnings = earningsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get monthly stats
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const statsSnapshot = await db.collection('affiliate_stats')
      .where('affiliateId', '==', affiliateId)
      .where('date', '>=', currentMonth + '-01')
      .get();

    const monthlyStats = {
      conversions: 0,
      earnings: 0,
      clicks: 0
    };

    statsSnapshot.docs.forEach(doc => {
      const stat = doc.data();
      monthlyStats.conversions += stat.conversions || 0;
      monthlyStats.earnings += stat.totalEarnings || 0;
      monthlyStats.clicks += stat.clicks || 0;
    });

    return {
      affiliate: {
        id: affiliateId,
        ...affiliate
      },
      recentEarnings: earnings,
      monthlyStats,
      referralUrl: `${functions.config().app.url}?ref=${affiliate.referralCode}`
    };

  } catch (error) {
    console.error('❌ Error getting affiliate dashboard:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to get affiliate dashboard');
  }
});
