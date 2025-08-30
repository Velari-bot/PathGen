import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('No Stripe signature found');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`Webhook received: ${event.type} (ID: ${event.id})`);

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
      console.error(`Error processing webhook event ${event.type}:`, error);
      
      // Return 200 even on error to prevent Stripe from retrying
      return NextResponse.json({ 
        received: true, 
        error: error instanceof Error ? error.message : 'Unknown error',
        event_type: event.type,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}

// Handle checkout session completion
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    console.log(`Checkout session completed: ${session.id}`);
    
    // If this is a subscription checkout, the subscription.created event will handle the rest
    if (session.mode === 'subscription') {
      console.log(`Subscription checkout completed for customer: ${session.customer}`);
      
      // Update user's subscription status if we have userId in metadata
      if (session.metadata?.userId) {
        await db.collection('users').doc(session.metadata.userId).update({
          'subscription.status': 'pending',
          'subscription.stripeCustomerId': session.customer,
          updatedAt: new Date()
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
      timestamp: new Date(),
      metadata: session.metadata || {}
    });
    
  } catch (error) {
    console.error('Error handling checkout completion:', error);
  }
}

// Handle new subscription creation
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    console.log(`🆕 Processing subscription creation: ${subscription.id}`);
    
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    
    // Check if customer is deleted
    if (customer.deleted) {
      console.error('❌ Customer was deleted');
      return;
    }
    
    const userId = (customer as Stripe.Customer).metadata.userId;
    
    if (!userId) {
      console.error('❌ No userId found in customer metadata');
      return;
    }

    const plan = getPlanFromPriceId(subscription.items.data[0].price.id);
    const limits = getPlanLimits(plan);

    // Create comprehensive subscription data
    const subscriptionData = {
      userId,
      stripeCustomerId: subscription.customer,
      stripeSubscriptionId: subscription.id,
      plan,
      status: subscription.status === 'active' ? 'active' : 'unpaid',
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
    };

    // Create subscription document
    await db.collection('subscriptions').doc(subscription.id).set(subscriptionData);

    // Update user document with full subscription data
    await db.collection('users').doc(userId).update({
      subscription: subscriptionData,
      'subscription.plan': plan,
      'subscription.status': subscription.status,
      'subscription.tier': plan,
      'subscription.stripeCustomerId': subscription.customer,
      'subscription.stripeSubscriptionId': subscription.id,
      'subscriptionTier': plan, // Add this for credit system compatibility
      updatedAt: new Date()
    });

    console.log(`✅ Subscription created for user ${userId} with plan ${plan}`);
    
    // Log successful subscription creation
    await db.collection('webhookLogs').add({
      eventType: 'customer.subscription.created',
      subscriptionId: subscription.id,
      userId,
      plan,
      status: subscription.status,
      timestamp: new Date(),
      success: true
    });
    
  } catch (error) {
    console.error('❌ Error handling subscription creation:', error);
    
    // Log failed subscription creation
    await db.collection('webhookLogs').add({
      eventType: 'customer.subscription.created',
      subscriptionId: subscription.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
      success: false
    });
  }
}

// Handle subscription updates
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    console.log(`🔄 Processing subscription update: ${subscription.id}`);
    
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    
    if (customer.deleted) {
      console.error('❌ Customer was deleted');
      return;
    }
    
    const userId = (customer as Stripe.Customer).metadata.userId;
    if (!userId) {
      console.error('❌ No userId found in customer metadata');
      return;
    }

    const plan = getPlanFromPriceId(subscription.items.data[0].price.id);
    const limits = getPlanLimits(plan);

    // Update subscription document
    await db.collection('subscriptions').doc(subscription.id).update({
      plan,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      limits,
      updatedAt: new Date()
    });

    // Update user document
    await db.collection('users').doc(userId).update({
      'subscription.plan': plan,
      'subscription.status': subscription.status,
      'subscription.tier': plan,
      'subscriptionTier': plan, // Add this for credit system compatibility
      'subscription.currentPeriodStart': new Date(subscription.current_period_start * 1000),
      'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
      'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end,
      updatedAt: new Date()
    });

    console.log(`✅ Subscription updated for user ${userId}: ${subscription.status} (${plan})`);
    
    // Log successful subscription update
    await db.collection('webhookLogs').add({
      eventType: 'customer.subscription.updated',
      subscriptionId: subscription.id,
      userId,
      plan,
      status: subscription.status,
      timestamp: new Date(),
      success: true
    });
    
  } catch (error) {
    console.error('❌ Error handling subscription update:', error);
    
    // Log failed subscription update
    await db.collection('webhookLogs').add({
      eventType: 'customer.subscription.updated',
      subscriptionId: subscription.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
      success: false
    });
  }
}

// Handle subscription deletion
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    await db.collection('subscriptions').doc(subscription.id).update({
      status: 'canceled',
      updatedAt: new Date()
    });

    console.log(`Subscription ${subscription.id} marked as canceled`);
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
  }
}

// Handle successful payments
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    console.log(`💳 Processing payment success for invoice: ${invoice.id}`);
    
    if (invoice.subscription) {
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
      const customer = await stripe.customers.retrieve(subscription.customer as string);
      
      if (!customer.deleted) {
        const userId = (customer as Stripe.Customer).metadata.userId;
        
        if (userId) {
          // Update subscription document
          await db.collection('subscriptions').doc(invoice.subscription as string).update({
            status: 'active',
            updatedAt: new Date()
          });
          
          // Update user document
          await db.collection('users').doc(userId).update({
            'subscription.status': 'active',
            updatedAt: new Date()
          });
          
          console.log(`✅ Payment succeeded for user ${userId}, subscription activated`);
          
          // Log successful payment
          await db.collection('webhookLogs').add({
            eventType: 'invoice.payment_succeeded',
            invoiceId: invoice.id,
            subscriptionId: invoice.subscription,
            userId,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            timestamp: new Date(),
            success: true
          });
        }
      }
    }
  } catch (error) {
    console.error('❌ Error handling payment success:', error);
    
    // Log failed payment processing
    await db.collection('webhookLogs').add({
      eventType: 'invoice.payment_succeeded',
      invoiceId: invoice.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
      success: false
    });
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
    console.error('Error handling payment failure:', error);
  }
}

// Handle customer creation
async function handleCustomerCreated(customer: Stripe.Customer) {
  try {
    console.log(`Customer created: ${customer.id}`);
    
    // Log customer creation
    await db.collection('webhookLogs').add({
      eventType: 'customer.created',
      customerId: customer.id,
      email: customer.email,
      timestamp: new Date(),
      metadata: customer.metadata || {}
    });
    
  } catch (error) {
    console.error('Error handling customer creation:', error);
  }
}

// Handle payment method attachment
async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
  try {
    console.log(`Payment method attached: ${paymentMethod.id}`);
    
    // Log payment method attachment
    await db.collection('webhookLogs').add({
      eventType: 'payment_method.attached',
      paymentMethodId: paymentMethod.id,
      customerId: paymentMethod.customer,
      type: paymentMethod.type,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('Error handling payment method attachment:', error);
  }
}

// Helper function to get plan from Stripe price ID
function getPlanFromPriceId(priceId: string): string {
  const planMap: { [key: string]: string } = {
    'price_1RvsyxCitWuvPenEOtFzt5FC': 'pro' // PathGen Pro
  };
  return planMap[priceId] || 'free';
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
