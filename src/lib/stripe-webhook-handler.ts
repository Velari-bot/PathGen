/**
 * Stripe Webhook Handler for Credit System
 * Handles subscription events and automatically manages user credits
 */

import { Request, Response } from 'express';
import Stripe from 'stripe';
import { creditService } from './credit-backend-service';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Webhook endpoint secret for signature verification
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * Verify Stripe webhook signature
 * @param payload - Raw request body
 * @param signature - Stripe signature header
 * @returns Stripe.Event
 */
function verifyStripeSignature(payload: string, signature: string): Stripe.Event {
  try {
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    return event;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw new Error('Invalid signature');
  }
}

/**
 * Handle customer subscription created event
 * @param subscription - Stripe subscription object
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;
    const subscriptionId = subscription.id;
    
    // Get customer details from Stripe
    const customer = await stripe.customers.retrieve(customerId);
    
    if (customer.deleted) {
      console.error('Customer was deleted:', customerId);
      return;
    }

    const email = customer.email;
    const name = customer.name || customer.email || 'Unknown User';
    
    if (!email) {
      console.error('No email found for customer:', customerId);
      return;
    }

    // Find user by email or create new user
    const db = require('./firebase-admin-api').getDb();
    const usersRef = db.collection('users');
    const userQuery = await usersRef.where('email', '==', email).limit(1).get();
    
    let userId: string;
    
    if (userQuery.empty) {
      // Create new Pro user
      console.log(`Creating new Pro user for email: ${email}`);
      const newUserRef = usersRef.doc();
      userId = newUserRef.id;
      
      const result = await creditService.initializeUser(
        userId,
        name,
        email,
        'pro',
        subscriptionId,
        customerId
      );
      
      if (!result.success) {
        console.error('Failed to create new Pro user:', result.message);
        return;
      }
      
      console.log(`✅ New Pro user created: ${userId} with ${result.creditsRemaining} credits`);
    } else {
      // Upgrade existing user to Pro
      const userDoc = userQuery.docs[0];
      userId = userDoc.id;
      
      const result = await creditService.upgradeToPro(
        userId,
        subscriptionId,
        customerId
      );
      
      if (!result.success) {
        console.error('Failed to upgrade user to Pro:', result.message);
        return;
      }
      
      console.log(`✅ User upgraded to Pro: ${userId} with ${result.creditsRemaining} credits`);
    }

    // Update subscription status in user document
    await db.collection('users').doc(userId).update({
      subscriptionId,
      stripeCustomerId: customerId,
      subscriptionStatus: 'active',
      updatedAt: new Date()
    });

  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

/**
 * Handle subscription updated event
 * @param subscription - Stripe subscription object
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const subscriptionId = subscription.id;
    const status = subscription.status;
    
    // Find user by subscription ID
    const db = require('./firebase-admin-api').getDb();
    const usersRef = db.collection('users');
    const userQuery = await usersRef.where('subscriptionId', '==', subscriptionId).limit(1).get();
    
    if (userQuery.empty) {
      console.error('No user found for subscription:', subscriptionId);
      return;
    }
    
    const userDoc = userQuery.docs[0];
    const userId = userDoc.id;
    
    if (status === 'active') {
      // Subscription is active - ensure user is Pro
      const userData = userDoc.data();
      if (userData.accountType !== 'pro') {
        await creditService.upgradeToPro(
          userId,
          subscriptionId,
          subscription.customer as string
        );
      }
    } else if (status === 'canceled' || status === 'unpaid') {
      // Subscription is canceled - downgrade to Free
      await db.collection('users').doc(userId).update({
        accountType: 'free',
        subscriptionStatus: 'canceled',
        updatedAt: new Date()
      });
      
      console.log(`✅ User ${userId} downgraded to Free due to subscription ${status}`);
    }
    
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

/**
 * Handle subscription deleted event
 * @param subscription - Stripe subscription object
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const subscriptionId = subscription.id;
    
    // Find user by subscription ID
    const db = require('./firebase-admin-api').getDb();
    const usersRef = db.collection('users');
    const userQuery = await usersRef.where('subscriptionId', '==', subscriptionId).limit(1).get();
    
    if (userQuery.empty) {
      console.error('No user found for subscription:', subscriptionId);
      return;
    }
    
    const userDoc = userQuery.docs[0];
    const userId = userDoc.id;
    
    // Downgrade user to Free
    await db.collection('users').doc(userId).update({
      accountType: 'free',
      subscriptionStatus: 'canceled',
      subscriptionId: null,
      updatedAt: new Date()
    });
    
    console.log(`✅ User ${userId} downgraded to Free due to subscription deletion`);
    
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

/**
 * Handle invoice payment succeeded event (monthly renewal)
 * @param invoice - Stripe invoice object
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    const subscriptionId = invoice.subscription as string;
    
    if (!subscriptionId) {
      console.log('Invoice is not associated with a subscription');
      return;
    }
    
    // Find user by subscription ID
    const db = require('./firebase-admin-api').getDb();
    const usersRef = db.collection('users');
    const userQuery = await usersRef.where('subscriptionId', '==', subscriptionId).limit(1).get();
    
    if (userQuery.empty) {
      console.error('No user found for subscription:', subscriptionId);
      return;
    }
    
    const userDoc = userQuery.docs[0];
    const userId = userDoc.id;
    
    // Add monthly Pro credits
    const result = await creditService.handleSubscriptionRenewal(userId, subscriptionId);
    
    if (result.success) {
      console.log(`✅ Monthly credits added for user ${userId}: ${result.creditsChanged} credits`);
    } else {
      console.error('Failed to add monthly credits:', result.message);
    }
    
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
  }
}

/**
 * Main webhook handler function
 * @param req - Express request object
 * @param res - Express response object
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  try {
    const signature = req.headers['stripe-signature'] as string;
    
    if (!signature) {
      console.error('No Stripe signature found');
      return res.status(400).json({ error: 'No signature' });
    }

    // Verify webhook signature
    const event = verifyStripeSignature(req.body, signature);
    
    console.log(`Received Stripe webhook: ${event.type}`);

    // Handle different event types
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
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
        
      case 'invoice.payment_failed':
        console.log('Payment failed for subscription:', event.data.object);
        // Handle payment failure if needed
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook handler failed' });
  }
}

/**
 * Manual subscription upgrade function for testing
 * @param userId - User ID to upgrade
 * @param subscriptionId - Stripe subscription ID
 * @param customerId - Stripe customer ID
 */
export async function manualUpgradeToPro(
  userId: string,
  subscriptionId: string,
  customerId: string
) {
  try {
    const result = await creditService.upgradeToPro(userId, subscriptionId, customerId);
    
    if (result.success) {
      console.log(`✅ Manual upgrade successful: ${userId} now has ${result.creditsRemaining} credits`);
    } else {
      console.error('Manual upgrade failed:', result.message);
    }
    
    return result;
  } catch (error) {
    console.error('Error in manual upgrade:', error);
    return {
      success: false,
      creditsRemaining: 0,
      creditsChanged: 0,
      message: 'Manual upgrade failed'
    };
  }
}
