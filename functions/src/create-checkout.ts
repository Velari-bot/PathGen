import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import { CheckoutSessionData } from './types/subscription';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: '2023-10-16'
});

// Create checkout session for subscription
export const createCheckoutSession = functions.https.onCall(async (data: CheckoutSessionData, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const { priceId, successUrl, cancelUrl } = data;

  try {
    // Validate price ID
    if (!priceId) {
      throw new functions.https.HttpsError('invalid-argument', 'Price ID is required');
    }

    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();
    if (!userData) {
      throw new functions.https.HttpsError('not-found', 'User data not found');
    }
    
    const customerId = userData.subscription?.stripeCustomerId;

    let customer: Stripe.Customer;

    if (customerId) {
      // Use existing customer
      try {
        customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
      } catch (error) {
        console.error('Error retrieving existing customer:', error);
        // Create new customer if retrieval fails
        customer = await stripe.customers.create({
          email: userData.email,
          metadata: { userId },
          name: userData.displayName || userData.email?.split('@')[0] || 'User'
        });
      }
    } else {
      // Create new customer
      customer = await stripe.customers.create({
        email: userData.email,
        metadata: { userId },
        name: userData.displayName || userData.email?.split('@')[0] || 'User'
      });

      // Update user with customer ID
      await db.collection('users').doc(userId).update({
        'subscription.stripeCustomerId': customer.id
      });
    }

    // Get plan information
    const plan = getPlanFromPriceId(priceId);
    
    // Set default URLs if not provided
    const defaultSuccessUrl = `${functions.config().app.url}/dashboard?success=true&plan=${plan}`;
    const defaultCancelUrl = `${functions.config().app.url}/pricing?canceled=true`;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [{ 
        price: priceId, 
        quantity: 1 
      }],
      mode: 'subscription',
      success_url: successUrl || defaultSuccessUrl,
      cancel_url: cancelUrl || defaultCancelUrl,
      metadata: {
        userId,
        plan
      },
      subscription_data: {
        metadata: {
          userId
        },
        trial_period_days: plan === 'pro' ? 7 : 0, // 7-day trial for Pro plan
      },
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto'
      },
      allow_promotion_codes: true,
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
      locale: 'auto'
    });

    console.log(`Checkout session created for user ${userId}: ${session.id}`);

    return {
      sessionId: session.id,
      url: session.url!
    };

  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to create checkout session');
  }
});

// Create portal session for subscription management
export const createPortalSession = functions.https.onCall(async (data: { returnUrl?: string }, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const { returnUrl } = data;

  try {
    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();
    if (!userData) {
      throw new functions.https.HttpsError('not-found', 'User data not found');
    }

    const customerId = userData.subscription?.stripeCustomerId;
    if (!customerId) {
      throw new functions.https.HttpsError('failed-precondition', 'No subscription found');
    }

    // Set default return URL if not provided
    const defaultReturnUrl = `${functions.config().app.url}/dashboard`;
    
    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || defaultReturnUrl,
    });

    console.log(`Portal session created for user ${userId}: ${session.id}`);

    return { url: session.url };

  } catch (error) {
    console.error('Error creating portal session:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to create portal session');
  }
});

// Get subscription information
export const getSubscriptionInfo = functions.https.onCall(async (data: any, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;

  try {
    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();
    if (!userData) {
      throw new functions.https.HttpsError('not-found', 'User data not found');
    }

    const subscription = userData.subscription;
    if (!subscription) {
      return { hasSubscription: false };
    }

    // If user has a Stripe subscription, get additional details
    if (subscription.stripeSubscriptionId) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
        
        return {
          hasSubscription: true,
          subscription: {
            ...subscription,
            stripeStatus: stripeSubscription.status,
            currentPeriodEnd: stripeSubscription.current_period_end,
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end
          }
        };
      } catch (error) {
        console.error('Error retrieving Stripe subscription:', error);
        // Return local subscription data if Stripe call fails
        return {
          hasSubscription: true,
          subscription,
          stripeError: 'Failed to retrieve subscription details'
        };
      }
    }

    return {
      hasSubscription: true,
      subscription
    };

  } catch (error) {
    console.error('Error getting subscription info:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to get subscription information');
  }
});

// Helper functions
function getPlanFromPriceId(priceId: string): string {
  const priceMap: { [key: string]: string } = {
    'price_free': 'free',
    'price_1RvsvqCitWuvPenEw9TefOig': 'standard', // PathGen Standard
    'price_1RvsyxCitWuvPenEOtFzt5FC': 'pro' // PathGen Pro
  };
  return priceMap[priceId] || 'free';
}
