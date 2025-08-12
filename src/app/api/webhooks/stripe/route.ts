import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { doc, updateDoc, getFirestore } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

// Initialize Firebase for webhook
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: any;
let db: any;

if (firebaseConfig.apiKey) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Payment successful for session:', session.id);
        
        // Update user subscription status in Firestore
        if (db && session.metadata?.userId) {
          try {
            const userRef = doc(db, 'users', session.metadata.userId);
            await updateDoc(userRef, {
              subscriptionStatus: 'active',
              subscriptionTier: 'pro',
              stripeCustomerId: session.customer,
              stripeSubscriptionId: session.subscription,
              lastPayment: new Date(),
            });
            console.log('User subscription updated successfully');
          } catch (error) {
            console.error('Error updating user subscription:', error);
          }
        }
        break;

      case 'customer.subscription.created':
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription created:', subscription.id);
        
        // Update user subscription status
        if (db && subscription.metadata?.userId) {
          try {
            const userRef = doc(db, 'users', subscription.metadata.userId);
            await updateDoc(userRef, {
              subscriptionStatus: 'active',
              subscriptionTier: 'pro',
              stripeCustomerId: subscription.customer,
              stripeSubscriptionId: subscription.id,
              lastPayment: new Date(),
            });
            console.log('User subscription created successfully');
          } catch (error) {
            console.error('Error updating user subscription:', error);
          }
        }
        break;

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object as Stripe.Subscription;
        console.log('Subscription updated:', updatedSubscription.id);
        
        // Update user subscription status
        if (db && updatedSubscription.metadata?.userId) {
          try {
            const userRef = doc(db, 'users', updatedSubscription.metadata.userId);
            await updateDoc(userRef, {
              subscriptionStatus: updatedSubscription.status === 'active' ? 'active' : 'inactive',
              lastPayment: new Date(),
            });
            console.log('User subscription updated successfully');
          } catch (error) {
            console.error('Error updating user subscription:', error);
          }
        }
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        console.log('Subscription deleted:', deletedSubscription.id);
        
        // Update user subscription status to inactive
        if (db && deletedSubscription.metadata?.userId) {
          try {
            const userRef = doc(db, 'users', deletedSubscription.metadata.userId);
            await updateDoc(userRef, {
              subscriptionStatus: 'inactive',
              subscriptionTier: null,
              stripeSubscriptionId: null,
            });
            console.log('User subscription deactivated successfully');
          } catch (error) {
            console.error('Error updating user subscription:', error);
          }
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
