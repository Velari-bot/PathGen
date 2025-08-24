const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(functions.config().stripe.secret_key);

admin.initializeApp();

const db = admin.firestore();

// Stripe webhook handler for subscription events
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  console.log(`Webhook received: ${req.method} ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  
  const sig = req.headers['stripe-signature'];
  const endpointSecret = functions.config().stripe.webhook_secret;

  if (!endpointSecret) {
    console.error('Webhook secret not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
    console.log(`Event verified: ${event.type} (ID: ${event.id})`);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      case 'customer.created':
        await handleCustomerCreated(event.data.object);
        break;
      case 'payment_method.attached':
        await handlePaymentMethodAttached(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Always return a success response
    res.status(200).json({ 
      received: true, 
      event_type: event.type,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`Error processing webhook event ${event.type}:`, error);
    
    // Return 200 even on error to prevent Stripe from retrying
    // This is important for webhook reliability
    res.status(200).json({ 
      received: true, 
      error: error.message,
      event_type: event.type,
      timestamp: new Date().toISOString()
    });
  }
});

// Handle new subscription creation
async function handleSubscriptionCreated(subscription) {
  try {
    const customer = await stripe.customers.retrieve(subscription.customer);
    const userId = customer.metadata.userId;
    
    if (!userId) {
      console.error('No userId found in customer metadata');
      return;
    }

    const plan = getPlanFromPriceId(subscription.items.data[0].price.id);
    const limits = getPlanLimits(plan);

    await db.collection('subscriptions').doc(subscription.id).set({
      userId,
      stripeCustomerId: subscription.customer,
      stripeSubscriptionId: subscription.id,
      plan,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      limits,
      usage: {
        messagesUsed: 0,
        tokensUsed: 0,
        dataPullsUsed: 0,
        replayUploadsUsed: 0,
        tournamentStrategiesUsed: 0,
        resetDate: new Date()
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update user profile with subscription info
    await db.collection('users').doc(userId).update({
      'subscription.status': plan,
      'subscription.tier': plan,
      'subscription.stripeCustomerId': subscription.customer,
      'subscription.stripeSubscriptionId': subscription.id
    });

    console.log(`Subscription created for user ${userId} with plan ${plan}`);
  } catch (error) {
    console.error('Error handling subscription creation:', error);
  }
}

// Handle subscription updates
async function handleSubscriptionUpdated(subscription) {
  try {
    const plan = getPlanFromPriceId(subscription.items.data[0].price.id);
    const limits = getPlanLimits(plan);

    await db.collection('subscriptions').doc(subscription.id).update({
      plan,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      limits,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`Subscription updated for ${subscription.id} to plan ${plan}`);
  } catch (error) {
    console.error('Error handling subscription update:', error);
  }
}

// Handle subscription deletion
async function handleSubscriptionDeleted(subscription) {
  try {
    await db.collection('subscriptions').doc(subscription.id).update({
      status: 'canceled',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`Subscription ${subscription.id} marked as canceled`);
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
  }
}

// Handle successful payments
async function handlePaymentSucceeded(invoice) {
  try {
    if (invoice.subscription) {
      await db.collection('subscriptions').doc(invoice.subscription).update({
        status: 'active',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

// Handle failed payments
async function handlePaymentFailed(invoice) {
  try {
    if (invoice.subscription) {
      await db.collection('subscriptions').doc(invoice.subscription).update({
        status: 'past_due',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

// Handle checkout session completion
async function handleCheckoutCompleted(session) {
  try {
    console.log(`Checkout session completed: ${session.id}`);
    
    // If this is a subscription checkout, the subscription.created event will handle the rest
    if (session.mode === 'subscription') {
      console.log(`Subscription checkout completed for customer: ${session.customer}`);
      
      // Update user's subscription status if we have userId in metadata
      if (session.metadata && session.metadata.userId) {
        await db.collection('users').doc(session.metadata.userId).update({
          'subscription.status': 'pending',
          'subscription.stripeCustomerId': session.customer,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Updated user ${session.metadata.userId} with pending subscription`);
      }
    }
    
    // Log the checkout completion
    await db.collection('webhookLogs').add({
      eventType: 'checkout.session.completed',
      sessionId: session.id,
      customerId: session.customer,
      mode: session.mode,
      amount: session.amount_total,
      currency: session.currency,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata: session.metadata || {}
    });
    
  } catch (error) {
    console.error('Error handling checkout completion:', error);
  }
}

// Handle customer creation
async function handleCustomerCreated(customer) {
  try {
    console.log(`Customer created: ${customer.id}`);
    
    // Log customer creation
    await db.collection('webhookLogs').add({
      eventType: 'customer.created',
      customerId: customer.id,
      email: customer.email,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata: customer.metadata || {}
    });
    
  } catch (error) {
    console.error('Error handling customer creation:', error);
  }
}

// Handle payment method attachment
async function handlePaymentMethodAttached(paymentMethod) {
  try {
    console.log(`Payment method attached: ${paymentMethod.id}`);
    
    // Log payment method attachment
    await db.collection('webhookLogs').add({
      eventType: 'payment_method.attached',
      paymentMethodId: paymentMethod.id,
      customerId: paymentMethod.customer,
      type: paymentMethod.type,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
  } catch (error) {
    console.error('Error handling payment method attachment:', error);
  }
}

// Monthly usage reset function (runs on the 1st of every month)
exports.monthlyUsageReset = functions.pubsub.schedule('0 0 1 * *').onRun(async (context) => {
  try {
    const subscriptionsRef = db.collection('subscriptions');
    const snapshot = await subscriptionsRef.get();

    const batch = db.batch();
    const now = new Date();

    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        'usage.messagesUsed': 0,
        'usage.tokensUsed': 0,
        'usage.dataPullsUsed': 0,
        'usage.replayUploadsUsed': 0,
        'usage.tournamentStrategiesUsed': 0,
        'usage.resetDate': now,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();
    console.log(`Reset usage for ${snapshot.size} subscriptions`);
  } catch (error) {
    console.error('Error resetting monthly usage:', error);
  }
});

// Function to handle Fortnite API calls securely
exports.fortniteApiProxy = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const { endpoint, params } = data;

  try {
    // Check user limits
    const subscription = await db.collection('subscriptions')
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (subscription.empty) {
      throw new functions.https.HttpsError('permission-denied', 'No subscription found');
    }

    const sub = subscription.docs[0].data();
    const limits = sub.limits;

    // Check if user has remaining data pulls
    if (sub.usage.dataPullsUsed >= limits.monthlyDataPulls) {
      throw new functions.https.HttpsError('resource-exhausted', 'Monthly data pull limit reached');
    }

    // Make API call using server-side API key
    const apiKey = functions.config().fortnite.api_key;
    const response = await fetch(`https://fortnite-api.com/v2/${endpoint}`, {
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    const result = await response.json();

    // Log usage
    await db.collection('usageLogs').add({
      userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      requestType: 'data_pull',
      tokensUsed: 0,
      cost: 0,
      details: {
        endpoint,
        success: true,
        metadata: { apiResponse: result }
      },
      subscriptionTier: sub.plan,
      remainingTokens: limits.monthlyTokens - sub.usage.tokensUsed
    });

    // Update subscription usage
    await db.collection('subscriptions').doc(subscription.docs[0].id).update({
      'usage.dataPullsUsed': admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return result;
  } catch (error) {
    console.error('Error in Fortnite API proxy:', error);
    throw new functions.https.HttpsError('internal', 'API call failed');
  }
});

// Helper function to get plan from Stripe price ID
function getPlanFromPriceId(priceId) {
  const planMap = {
    'price_free': 'free',
    'price_standard': 'standard',
    'price_pro': 'pro'
  };
  return planMap[priceId] || 'free';
}

// Helper function to get plan limits
function getPlanLimits(plan) {
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
  
  return limits[plan] || limits.free;
}

// Analytics function to track DAUs and feature usage
exports.trackAnalytics = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const { feature, metadata } = data;

  try {
    // Track daily active user
    const today = new Date().toISOString().split('T')[0];
    const dauRef = db.collection('analytics').doc('dailyActiveUsers').collection('dates').doc(today);
    
    await dauRef.set({
      [userId]: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Track feature usage
    const featureRef = db.collection('analytics').doc('featureUsage').collection('features').doc(feature);
    
    await featureRef.set({
      [userId]: {
        lastUsed: admin.firestore.FieldValue.serverTimestamp(),
        usageCount: admin.firestore.FieldValue.increment(1),
        metadata
      }
    }, { merge: true });

    return { success: true };
  } catch (error) {
    console.error('Error tracking analytics:', error);
    throw new functions.https.HttpsError('internal', 'Analytics tracking failed');
  }
});

// Content moderation function (optional)
exports.moderateContent = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { content, contentType } = data;

  try {
    // Basic content filtering (you can integrate with more sophisticated services)
    const inappropriateWords = ['spam', 'inappropriate', 'banned'];
    const hasInappropriateContent = inappropriateWords.some(word => 
      content.toLowerCase().includes(word)
    );

    if (hasInappropriateContent) {
      return {
        allowed: false,
        reason: 'Content contains inappropriate language',
        flaggedWords: inappropriateWords.filter(word => 
          content.toLowerCase().includes(word)
        )
      };
    }

    return {
      allowed: true,
      reason: 'Content passed moderation'
    };
  } catch (error) {
    console.error('Error in content moderation:', error);
    throw new functions.https.HttpsError('internal', 'Content moderation failed');
  }
});
