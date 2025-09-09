import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin if not already initialized
let db: any;

function initializeFirebase() {
  if (getApps().length === 0) {
    if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      try {
        initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID || 'pathgen-a771b',
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
        });
      } catch (error: any) {
        if (error.code !== 'app/duplicate-app') {
          console.error('❌ Firebase Admin initialization error:', error);
        }
      }
    }
  }
  return getFirestore();
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    // Initialize Firebase when the API route is called
    db = initializeFirebase();
    
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('No Stripe signature found');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log(`✅ Webhook verified: ${event.type} (ID: ${event.id})`);
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;
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
        case 'customer.created':
          await handleCustomerCreated(event.data.object as Stripe.Customer);
          break;
        case 'payment_method.attached':
          await handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
          break;
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      // Always return a success response
      return NextResponse.json({ 
        received: true, 
        event_type: event.type,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error(`❌ Error processing webhook event ${event.type}:`, error);
      
      // Return 200 even on error to prevent Stripe from retrying
      return NextResponse.json({ 
        received: true, 
        error: error instanceof Error ? error.message : 'Unknown error',
        event_type: event.type,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}

// Handle new subscription creation
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    
    // Check if customer is deleted
    if (customer.deleted) {
      console.error('❌ Customer has been deleted');
      return;
    }
    
    const userId = customer.metadata.userId;
    
    if (!userId) {
      console.error('❌ No userId found in customer metadata');
      return;
    }

    const plan = getPlanFromPriceId(subscription.items.data[0].price.id);
    const limits = getPlanLimits(plan);

    // Save subscription to Firebase
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
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Update user profile with subscription info
    try {
      await db.collection('users').doc(userId).update({
        'subscription.status': plan,
        'subscription.tier': plan,
        'subscription.stripeCustomerId': subscription.customer,
        'subscription.stripeSubscriptionId': subscription.id,
        updatedAt: new Date()
      });
      console.log(`✅ User ${userId} subscription updated to plan ${plan}`);
    } catch (userError) {
      console.error(`❌ Error updating user ${userId} subscription:`, userError);
      // Try to create user document if it doesn't exist
      try {
        await db.collection('users').doc(userId).set({
          subscription: {
            status: plan,
            tier: plan,
            stripeCustomerId: subscription.customer,
            stripeSubscriptionId: subscription.id
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }, { merge: true });
        console.log(`✅ Created user document for ${userId} with subscription ${plan}`);
      } catch (createError) {
        console.error(`❌ Failed to create user document for ${userId}:`, createError);
      }
    }

    console.log(`✅ Subscription created for user ${userId} with plan ${plan}`);
  } catch (error) {
    console.error('❌ Error handling subscription creation:', error);
  }
}

// Handle subscription updates
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const plan = getPlanFromPriceId(subscription.items.data[0].price.id);
    const limits = getPlanLimits(plan);

    // Update subscription document
    await db.collection('subscriptions').doc(subscription.id).update({
      plan,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      limits,
      updatedAt: new Date()
    });

    // Get customer to find userId
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    
    // Check if customer is deleted
    if (customer.deleted) {
      console.error('❌ Customer has been deleted');
      return;
    }
    
    const userId = customer.metadata.userId;
    
    if (userId) {
      // Update user profile with subscription info
      try {
        await db.collection('users').doc(userId).update({
          'subscription.status': plan,
          'subscription.tier': plan,
          'subscription.stripeCustomerId': subscription.customer,
          'subscription.stripeSubscriptionId': subscription.id,
          updatedAt: new Date()
        });
        console.log(`✅ User ${userId} subscription updated to plan ${plan}`);
      } catch (userError) {
        console.error(`❌ Error updating user ${userId} subscription:`, userError);
        // Try to create user document if it doesn't exist
        try {
          await db.collection('users').doc(userId).set({
            subscription: {
              status: plan,
              tier: plan,
              stripeCustomerId: subscription.customer,
              stripeSubscriptionId: subscription.id
            },
            createdAt: new Date(),
            updatedAt: new Date()
          }, { merge: true });
          console.log(`✅ Created user document for ${userId} with subscription ${plan}`);
        } catch (createError) {
          console.error(`❌ Failed to create user document for ${userId}:`, createError);
        }
      }
    } else {
      console.warn(`⚠️ No userId found in customer metadata for subscription ${subscription.id}`);
    }

    console.log(`✅ Subscription updated for ${subscription.id} to plan ${plan}`);
  } catch (error) {
    console.error('❌ Error handling subscription update:', error);
  }
}

// Handle subscription deletion
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    await db.collection('subscriptions').doc(subscription.id).update({
      status: 'canceled',
      updatedAt: new Date()
    });

    console.log(`✅ Subscription ${subscription.id} marked as canceled`);
  } catch (error) {
    console.error('❌ Error handling subscription deletion:', error);
  }
}

// Handle successful payments
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    if (invoice.subscription) {
      // Update subscription status
      await db.collection('subscriptions').doc(invoice.subscription as string).update({
        status: 'active',
        updatedAt: new Date()
      });

      // Get subscription details to update user
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
      const customer = await stripe.customers.retrieve(subscription.customer as string);
      
      // Check if customer is deleted
      if (customer.deleted) {
        console.error('❌ Customer has been deleted');
        return;
      }
      
      const userId = customer.metadata.userId;
      
      if (userId) {
        const plan = getPlanFromPriceId(subscription.items.data[0].price.id);
        try {
          await db.collection('users').doc(userId).update({
            'subscription.status': 'active',
            'subscription.tier': plan,
            updatedAt: new Date()
          });
          console.log(`✅ User ${userId} payment succeeded, subscription active`);
        } catch (userError) {
          console.error(`❌ Error updating user ${userId} payment status:`, userError);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error handling payment success:', error);
  }
}

// Handle failed payments
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    if (invoice.subscription) {
      await db.collection('subscriptions').doc(invoice.subscription as string).update({
        status: 'past_due',
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error('❌ Error handling payment failure:', error);
  }
}

// Handle checkout session completion
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    console.log(`✅ Checkout session completed: ${session.id}`);
    
    // If this is a subscription checkout, the subscription.created event will handle the rest
    if (session.mode === 'subscription') {
      console.log(`✅ Subscription checkout completed for customer: ${session.customer}`);
      
      // Update user's subscription status if we have userId in metadata
      if (session.metadata?.userId) {
        await db.collection('users').doc(session.metadata.userId).update({
          'subscription.status': 'pending',
          'subscription.stripeCustomerId': session.customer,
          updatedAt: new Date()
        });
        console.log(`✅ Updated user ${session.metadata.userId} with pending subscription`);
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
      timestamp: new Date(),
      metadata: session.metadata || {}
    });
    
  } catch (error) {
    console.error('❌ Error handling checkout completion:', error);
  }
}

// Handle customer creation
async function handleCustomerCreated(customer: Stripe.Customer) {
  try {
    console.log(`✅ Customer created: ${customer.id}`);
    
    // Log customer creation
    await db.collection('webhookLogs').add({
      eventType: 'customer.created',
      customerId: customer.id,
      email: customer.email,
      timestamp: new Date(),
      metadata: customer.metadata || {}
    });
    
  } catch (error) {
    console.error('❌ Error handling customer creation:', error);
  }
}

// Handle payment method attachment
async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
  try {
    console.log(`✅ Payment method attached: ${paymentMethod.id}`);
    
    // Log payment method attachment
    await db.collection('webhookLogs').add({
      eventType: 'payment_method.attached',
      paymentMethodId: paymentMethod.id,
      customerId: paymentMethod.customer,
      type: paymentMethod.type,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('❌ Error handling payment method attachment:', error);
  }
}

// Helper function to get plan from Stripe price ID
function getPlanFromPriceId(priceId: string): string {
  const planMap: { [key: string]: string } = {
    'price_free': 'free',
    'price_1RvsyxCitWuvPenEOtFzt5FC': 'pro', // PathGen Pro (old)
    'price_1RvsvqCitWuvPenEw9TefOig': 'pro', // PathGen Pro (new)
    'price_1S5WVCCitWuvPenEYZcAxQfO': 'pro'  // PathGen Pro (additional)
  };
  
  console.log(`🔍 [stripe/route] Mapping price ID: ${priceId}`);
  const plan = planMap[priceId];
  
  if (!plan) {
    console.warn(`⚠️ [stripe/route] Unknown price ID: ${priceId}, defaulting to 'pro' for paid subscriptions`);
    return 'pro';
  }
  
  console.log(`✅ [stripe/route] Mapped price ID ${priceId} to plan: ${plan}`);
  return plan;
}

// Helper function to get plan limits
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
