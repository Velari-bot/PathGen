import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 STRIPE WEBHOOK RECEIVED');
    console.log('📋 Headers:', JSON.stringify(Object.fromEntries(request.headers.entries()), null, 2));
    
    const body = await request.text();
    console.log('📄 Body length:', body.length);
    console.log('📄 Body preview:', body.substring(0, 200) + '...');
    
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

    console.log(`🔍 Webhook received: ${event.type} (ID: ${event.id})`);
    console.log('📋 Event data:', JSON.stringify(event.data, null, 2));

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

    // Update ALL collections for the user
    await updateAllCollectionsForUser(userId, plan, subscriptionData);

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

    // Update subscription data
    const updatedSubscriptionData = {
      userId,
      stripeCustomerId: subscription.customer,
      stripeSubscriptionId: subscription.id,
      plan,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      limits,
      updatedAt: new Date()
    };

    // Update ALL collections for the user
    await updateAllCollectionsForUser(userId, plan, updatedSubscriptionData);

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
          console.log(`🔄 Processing payment success for user: ${userId}`);
          
          // Get subscription data and update ALL collections
          const plan = getPlanFromPriceId(subscription.items.data[0].price.id);
          const subscriptionData = {
            userId,
            stripeCustomerId: subscription.customer,
            stripeSubscriptionId: subscription.id,
            plan,
            status: 'active',
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
            limits: getPlanLimits(plan),
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

          // Update ALL collections for the user
          await updateAllCollectionsForUser(userId, plan, subscriptionData);
          
          console.log(`✅ Payment success processed for user ${userId} with plan ${plan}`);
          
          // Log successful payment processing
          await db.collection('webhookLogs').add({
            eventType: 'invoice.payment_succeeded',
            invoiceId: invoice.id,
            subscriptionId: invoice.subscription,
            userId,
            plan,
            status: 'active',
            timestamp: new Date(),
            success: true,
            message: `Payment succeeded for ${plan} subscription`
          });
          
        } else {
          console.error('❌ No userId found in customer metadata for payment success');
        }
      } else {
        console.error('❌ Customer was deleted for payment success');
      }
    }
  } catch (error) {
    console.error('❌ Error handling payment success:', error);
    
    // Log the error
    try {
      await db.collection('webhookLogs').add({
        eventType: 'invoice.payment_succeeded',
        invoiceId: invoice.id,
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } catch (logError) {
      console.error('❌ Failed to log payment success error:', logError);
    }
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
    'price_1RvsyxCitWuvPenEOtFzt5FC': 'pro', // PathGen Pro (old)
    'price_1RvsvqCitWuvPenEw9TefOig': 'pro'   // PathGen Pro (new)
  };
  return planMap[priceId] || 'free';
}

// Helper function to update ALL collections for a user
async function updateAllCollectionsForUser(userId: string, plan: string, subscriptionData: any) {
  try {
    console.log(`🔄 Updating ALL collections for user ${userId} to ${plan} tier...`);

    // 1. Update user document with the structure the frontend expects
    await db.collection('users').doc(userId).update({
      subscription: {
        status: subscriptionData.status,
        tier: plan,
        plan: plan,
        startDate: new Date(),
        endDate: null,
        autoRenew: true,
        paymentMethod: 'stripe',
        stripeCustomerId: subscriptionData.stripeCustomerId,
        stripeSubscriptionId: subscriptionData.stripeSubscriptionId
      },
      subscriptionStatus: 'active',
      subscriptionTier: plan,
      accountType: plan, // Ensure accountType is also set
      updatedAt: new Date()
    });

    // Also update the top-level subscriptionTier field to ensure it's always set
    await db.collection('users').doc(userId).update({
      subscriptionTier: plan,
      accountType: plan
    });

    // Update credits to Pro level if upgrading to Pro
    if (plan === 'pro') {
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();
      const currentCredits = userData?.credits || 0;
      
      if (currentCredits < 4000) {
        await db.collection('users').doc(userId).update({
          credits: 4000,
          credits_total: 4000,
          credits_remaining: 4000 - (userData?.credits_used || 0),
          last_updated: new Date()
        });
        console.log(`✅ Updated credits to Pro level (4000) for user ${userId}`);
      }
    }

    // 2. Update or create subscription document
    const subscriptionsSnapshot = await db.collection('subscriptions')
      .where('userId', '==', userId)
      .get();
    
    if (!subscriptionsSnapshot.empty) {
      // Update existing subscription
      await subscriptionsSnapshot.docs[0].ref.update(subscriptionData);
    } else {
      // Create new subscription document
      await db.collection('subscriptions').add(subscriptionData);
    }

    // 3. Update or create usage document
    const usageSnapshot = await db.collection('usage')
      .where('userId', '==', userId)
      .get();
    
    const usageData = {
      userId,
      subscriptionTier: plan,
      totalCredits: plan === 'pro' ? 4000 : 250,
      usedCredits: 0,
      availableCredits: plan === 'pro' ? 4000 : 250,
      lastReset: new Date(),
      updatedAt: new Date()
    };

    if (!usageSnapshot.empty) {
      // Update existing usage
      await usageSnapshot.docs[0].ref.update(usageData);
      console.log(`✅ Updated usage document for ${userId} to ${plan} tier`);
    } else {
      // Create new usage document
      await db.collection('usage').add(usageData);
      console.log(`✅ Created usage document for ${userId} with ${plan} tier`);
    }

    console.log(`✅ Successfully updated user ${userId} to ${plan} tier across all collections`);
  } catch (error) {
    console.error(`❌ Error updating collections for user ${userId}:`, error);
    throw error;
  }
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
