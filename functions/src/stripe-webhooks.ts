import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: '2023-10-16'
});

// Stripe webhook handler
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = functions.config().stripe.webhook_secret;

  let event: Stripe.Event;

  try {
    if (!req.rawBody) {
      res.status(400).send('No raw body found');
      return;
    }
    
    event = stripe.webhooks.constructEvent(req.rawBody, sig!, endpointSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Log webhook event
  await db.collection('webhookEvents').doc(event.id).set({
    eventId: event.id,
    eventType: event.type,
    eventData: event.data,
    processed: false,
    createdAt: admin.firestore.Timestamp.now()
  });

  try {
    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object as Stripe.Subscription);
        break;
      case 'customer.updated':
        await handleCustomerUpdated(event.data.object as Stripe.Customer);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark webhook as processed
    await db.collection('webhookEvents').doc(event.id).update({
      processed: true,
      processedAt: admin.firestore.Timestamp.now()
    });

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    
    // Mark webhook as failed
    await db.collection('webhookEvents').doc(event.id).update({
      processed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      processedAt: admin.firestore.Timestamp.now()
    });
    
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Handle subscription created
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  
  if (customer.deleted) {
    console.error('Customer was deleted');
    return;
  }
  
  const userId = (customer as Stripe.Customer).metadata.userId;
  if (!userId) {
    console.error('No userId in customer metadata');
    return;
  }

  const plan = getPlanFromPriceId(subscription.items.data[0].price.id);
  const planLimits = getPlanLimits(plan);

  // Create subscription document
  const subscriptionData = {
    userId,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: customerId,
    plan,
    status: subscription.status === 'active' ? 'active' : 'unpaid',
    currentPeriodStart: admin.firestore.Timestamp.fromDate(
      new Date(subscription.current_period_start * 1000)
    ),
    currentPeriodEnd: admin.firestore.Timestamp.fromDate(
      new Date(subscription.current_period_end * 1000)
    ),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    trialEnd: subscription.trial_end ? admin.firestore.Timestamp.fromDate(
      new Date(subscription.trial_end * 1000)
    ) : null,
    limits: planLimits,
    usage: {
      messagesUsed: 0,
      tokensUsed: 0,
      dataPullsUsed: 0,
      replayUploadsUsed: 0,
      tournamentStrategiesUsed: 0,
      resetDate: admin.firestore.Timestamp.fromDate(new Date())
    },
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  };

  // Update user document
  await db.collection('users').doc(userId).update({
    subscription: subscriptionData,
    'subscription.plan': plan,
    'subscription.status': subscription.status
  });

  // Create subscription document
  await db.collection('subscriptions').doc(subscription.id).set(subscriptionData);

  console.log(`Subscription created for user ${userId}: ${plan}`);
  
  // TODO: Send welcome email/notification
  await sendSubscriptionWelcomeEmail(userId, plan);
}

// Handle subscription updated
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  
  if (customer.deleted) {
    console.error('Customer was deleted');
    return;
  }
  
  const userId = (customer as Stripe.Customer).metadata.userId;
  if (!userId) {
    console.error('No userId in customer metadata');
    return;
  }

  // Update subscription document
  await db.collection('subscriptions').doc(subscription.id).update({
    status: subscription.status,
    currentPeriodStart: admin.firestore.Timestamp.fromDate(
      new Date(subscription.current_period_start * 1000)
    ),
    currentPeriodEnd: admin.firestore.Timestamp.fromDate(
      new Date(subscription.current_period_end * 1000)
    ),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    trialEnd: subscription.trial_end ? admin.firestore.Timestamp.fromDate(
      new Date(subscription.trial_end * 1000)
    ) : null,
    updatedAt: admin.firestore.Timestamp.now()
  });

  // Update user document
  await db.collection('users').doc(userId).update({
    'subscription.status': subscription.status,
    'subscription.updatedAt': admin.firestore.Timestamp.now()
  });

  console.log(`Subscription updated for user ${userId}: ${subscription.status}`);
}

// Handle subscription deleted
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  
  if (customer.deleted) {
    console.error('Customer was deleted');
    return;
  }
  
  const userId = (customer as Stripe.Customer).metadata.userId;
  if (!userId) {
    console.error('No userId in customer metadata');
    return;
  }

  // Update subscription document
  await db.collection('subscriptions').doc(subscription.id).update({
    status: 'canceled',
    updatedAt: admin.firestore.Timestamp.now()
  });

  // Update user document to free tier
  await db.collection('users').doc(userId).update({
    'subscription.plan': 'free',
    'subscription.status': 'canceled',
    'subscription.updatedAt': admin.firestore.Timestamp.now()
  });

  console.log(`Subscription canceled for user ${userId}`);
}

// Handle payment succeeded
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    await handleSubscriptionUpdated(subscription);
  }
}

// Handle payment failed
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    await handleSubscriptionUpdated(subscription);
  }
}

// Handle trial ending
async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  
  if (customer.deleted) {
    console.error('Customer was deleted');
    return;
  }
  
  const userId = (customer as Stripe.Customer).metadata.userId;
  if (!userId) {
    console.error('No userId in customer metadata');
    return;
  }

  console.log(`Trial ending for user ${userId}`);
  // TODO: Send trial ending notification
}

// Handle customer updated
async function handleCustomerUpdated(customer: Stripe.Customer) {
  const userId = customer.metadata.userId;
  if (!userId) {
    console.error('No userId in customer metadata');
    return;
  }

  // Update user document
  await db.collection('users').doc(userId).update({
    'subscription.stripeCustomerId': customer.id,
    'subscription.updatedAt': admin.firestore.Timestamp.now()
  });

  console.log(`Customer updated for user ${userId}`);
}

// Helper functions
function getPlanFromPriceId(priceId: string): string {
  const priceMap: { [key: string]: string } = {
    'price_free': 'free',
    'price_1RvsvqCitWuvPenEw9TefOig': 'standard', // PathGen Standard
    'price_1RvsyxCitWuvPenEOtFzt5FC': 'pro' // PathGen Pro
  };
  return priceMap[priceId] || 'free';
}

function getPlanLimits(plan: string): any {
  const limits = {
    free: { messages: 10, tokens: 1000, dataPulls: 5, replayUploads: 2, tournamentStrategies: 3 },
    standard: { messages: 100, tokens: 10000, dataPulls: 50, replayUploads: 20, tournamentStrategies: 30 },
    pro: { messages: -1, tokens: -1, dataPulls: -1, replayUploads: -1, tournamentStrategies: -1 }
  };
  return limits[plan as keyof typeof limits] || limits.free;
}

// Placeholder functions for notifications
async function sendSubscriptionWelcomeEmail(userId: string, plan: string) {
  console.log(`Welcome email sent to user ${userId} for plan ${plan}`);
  // TODO: Implement actual email sending
}
