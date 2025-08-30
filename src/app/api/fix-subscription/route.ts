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

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Initialize Firebase
    db = initializeFirebase();

    // Find the customer in Stripe by userId metadata
    const customers = await stripe.customers.list({
      limit: 100,
    });

    const customer = customers.data.find(c => c.metadata.userId === userId);
    
    if (!customer) {
      return NextResponse.json({ 
        error: 'No Stripe customer found for this user',
        userId 
      }, { status: 404 });
    }

    console.log(`✅ Found Stripe customer: ${customer.id} for user: ${userId}`);

    // Get the customer's subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      limit: 10,
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ 
        error: 'No active subscriptions found for this customer',
        customerId: customer.id,
        userId 
      }, { status: 404 });
    }

    const subscription = subscriptions.data[0]; // Get the most recent subscription
    console.log(`✅ Found subscription: ${subscription.id} with status: ${subscription.status}`);

    // Map price ID to plan
          const planMap: { [key: string]: string } = {
        'price_free': 'free',
        'price_1RvsvqCitWuvPenEw9TefOig': 'pro' // PathGen Pro
      };

    const priceId = subscription.items.data[0].price.id;
    const plan = planMap[priceId] || 'free';

    console.log(`✅ Mapped price ${priceId} to plan: ${plan}`);

    // Update user document in Firebase
    await db.collection('users').doc(userId).update({
      'subscription.status': plan,
      'subscription.tier': plan,
      'subscription.stripeCustomerId': customer.id,
      'subscription.stripeSubscriptionId': subscription.id,
      'subscriptionTier': plan,
      'subscriptionStatus': 'active',
      updatedAt: new Date()
    });

    // Also update/create subscription document
    await db.collection('subscriptions').doc(subscription.id).set({
      userId,
      stripeCustomerId: customer.id,
      stripeSubscriptionId: subscription.id,
      plan,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log(`✅ Successfully updated user ${userId} to plan ${plan}`);

    return NextResponse.json({
      success: true,
      userId,
      customerId: customer.id,
      subscriptionId: subscription.id,
      plan,
      status: subscription.status
    });

  } catch (error) {
    console.error('❌ Error fixing subscription:', error);
    return NextResponse.json({ 
      error: 'Failed to fix subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
