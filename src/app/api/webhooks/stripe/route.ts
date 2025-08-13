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
    console.log('🔔 Webhook received - processing...');
    
    const body = await request.text();
    const signature = headers().get('stripe-signature')!;

    console.log('📝 Request body length:', body.length);
    console.log('🔑 Signature header present:', !!signature);
    console.log('🔐 Webhook secret configured:', !!webhookSecret);

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log('✅ Webhook signature verified successfully');
      console.log('📊 Event type:', event.type);
      console.log('🆔 Event ID:', event.id);
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('💰 Payment successful for session:', session.id);
        console.log('👤 User ID from metadata:', session.metadata?.userId);
        console.log('💳 Customer ID:', session.customer);
        console.log('📅 Subscription ID:', session.subscription);
        
        // Update user subscription status in Firestore
        if (db && session.metadata?.userId) {
          try {
            console.log('🔥 Updating Firebase for user:', session.metadata.userId);
            const userRef = doc(db, 'users', session.metadata.userId);
            await updateDoc(userRef, {
              subscriptionStatus: 'active',
              subscriptionTier: 'pro',
              stripeCustomerId: session.customer,
              stripeSubscriptionId: session.subscription,
              lastPayment: new Date(),
            });
            console.log('✅ User subscription updated successfully in Firebase');
          } catch (error) {
            console.error('❌ Error updating user subscription in Firebase:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
          }
        } else {
          console.error('❌ Missing required data for Firebase update:');
          console.error('Database initialized:', !!db);
          console.error('User ID in metadata:', session.metadata?.userId);
        }
        break;

      case 'customer.subscription.created':
        const subscription = event.data.object as Stripe.Subscription;
        console.log('📅 Subscription created:', subscription.id);
        console.log('👤 User ID from metadata:', subscription.metadata?.userId);
        
        // Update user subscription status
        if (db && subscription.metadata?.userId) {
          try {
            console.log('🔥 Updating Firebase for subscription creation');
            const userRef = doc(db, 'users', subscription.metadata.userId);
            await updateDoc(userRef, {
              subscriptionStatus: 'active',
              subscriptionTier: 'pro',
              stripeCustomerId: subscription.customer,
              stripeSubscriptionId: subscription.id,
              lastPayment: new Date(),
            });
            console.log('✅ User subscription created successfully in Firebase');
          } catch (error) {
            console.error('❌ Error updating user subscription in Firebase:', error);
          }
        }
        break;

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object as Stripe.Subscription;
        console.log('📝 Subscription updated:', updatedSubscription.id);
        console.log('📊 New status:', updatedSubscription.status);
        
        // Update user subscription status
        if (db && updatedSubscription.metadata?.userId) {
          try {
            console.log('🔥 Updating Firebase for subscription update');
            const userRef = doc(db, 'users', updatedSubscription.metadata.userId);
            await updateDoc(userRef, {
              subscriptionStatus: updatedSubscription.status === 'active' ? 'active' : 'inactive',
              lastPayment: new Date(),
            });
            console.log('✅ User subscription updated successfully in Firebase');
          } catch (error) {
            console.error('❌ Error updating user subscription in Firebase:', error);
          }
        }
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        console.log('🗑️ Subscription deleted:', deletedSubscription.id);
        
        // Update user subscription status to inactive
        if (db && deletedSubscription.metadata?.userId) {
          try {
            console.log('🔥 Deactivating user subscription in Firebase');
            const userRef = doc(db, 'users', deletedSubscription.metadata.userId);
            await updateDoc(userRef, {
              subscriptionStatus: 'inactive',
              subscriptionTier: null,
              stripeSubscriptionId: null,
            });
            console.log('✅ User subscription deactivated successfully in Firebase');
          } catch (error) {
            console.error('❌ Error updating user subscription in Firebase:', error);
          }
        }
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    console.log('✅ Webhook processed successfully');
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
