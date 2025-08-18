import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { getApps } from 'firebase-admin/app';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Webhook received - starting processing...');
    
    // Check if webhook secret is configured
    if (!webhookSecret) {
      console.error('❌ STRIPE_WEBHOOK_SECRET is not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Check if Stripe secret key is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('❌ STRIPE_SECRET_KEY is not configured');
      return NextResponse.json(
        { error: 'Stripe secret key not configured' },
        { status: 500 }
      );
    }

    const body = await request.text();
    const signature = headers().get('stripe-signature');

    console.log('📝 Request body length:', body.length);
    console.log('🔑 Signature header present:', !!signature);
    console.log('🔐 Webhook secret configured:', !!webhookSecret);

    if (!signature) {
      console.error('❌ Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

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
    console.log('🔄 Processing event:', event.type);
    
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('💰 Payment successful for session:', session.id);
        console.log('👤 User ID from metadata:', session.metadata?.userId);
        console.log('💳 Customer ID:', session.customer);
        console.log('📅 Subscription ID:', session.subscription);
        console.log('🎫 Promo code used:', session.metadata?.promoCode);
        console.log('🏷️ Tier:', session.metadata?.tier);
        
        // Update Firebase user subscription status
        if (session.metadata?.userId) {
          try {
            // Initialize Firebase Admin if not already initialized
            if (getApps().length === 0) {
              if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PROJECT_ID) {
                try {
                  const { initializeApp, cert } = await import('firebase-admin/app');
                  initializeApp({
                    credential: cert({
                      projectId: process.env.FIREBASE_PROJECT_ID,
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
            
            const { doc, updateDoc } = await import('firebase-admin/firestore');
            const { getFirestore } = await import('firebase-admin/firestore');
            const db = getFirestore();

            if (!db) {
              console.error('❌ Firebase Admin not initialized in webhook');
              return NextResponse.json({ error: 'Firebase Admin not available' }, { status: 500 });
            }

            const userDocRef = doc(db, 'users', session.metadata.userId);
            
            // Determine subscription tier and status
            let subscriptionTier = 'free';
            let subscriptionStatus = 'active';
            
            if (session.metadata.tier === 'paid') {
              subscriptionTier = 'paid';
            } else if (session.metadata.tier === 'pro') {
              subscriptionTier = 'pro';
            }
            
            // Update user document with subscription info
            await updateDoc(userDocRef, {
              subscriptionStatus: subscriptionStatus,
              subscriptionTier: subscriptionTier,
              'subscription.status': subscriptionTier,
              'subscription.tier': subscriptionTier,
              'subscription.startDate': new Date(),
              'subscription.stripeCustomerId': session.customer,
              'subscription.stripeSubscriptionId': session.subscription,
              updatedAt: new Date()
            });
            
            console.log('✅ Firebase user subscription updated successfully');
            console.log('📊 New subscription:', { subscriptionTier, subscriptionStatus });
          } catch (error) {
            console.error('❌ Failed to update Firebase user subscription:', error);
          }
        }
        break;

      case 'customer.subscription.created':
        const subscription = event.data.object as Stripe.Subscription;
        console.log('📅 Subscription created:', subscription.id);
        console.log('👤 User ID from metadata:', subscription.metadata?.userId);
        console.log('📊 Subscription status:', subscription.status);
        
        // Update Firebase user subscription status
        if (subscription.metadata?.userId) {
          try {
            const { doc, updateDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');
            
            if (!db) {
              console.error('❌ Firebase not initialized in webhook');
              return NextResponse.json({ error: 'Firebase not available' }, { status: 500 });
            }
            
            const userDocRef = doc(db, 'users', subscription.metadata.userId);
            
            // Determine subscription tier based on price ID
            let subscriptionTier = 'free';
            if (subscription.items.data.length > 0) {
              const priceId = subscription.items.data[0].price.id;
              // Map your Stripe price IDs to tiers
                             if (priceId === 'price_1RvsvqCitWuvPenEw9TefOig') { // Standard tier
                subscriptionTier = 'paid';
                                                             } else if (priceId === 'price_1RvsyxCitWuvPenEOtFzt5FC') { // Pro tier
                subscriptionTier = 'pro';
              }
            }
            
            await updateDoc(userDocRef, {
              subscriptionStatus: subscription.status,
              subscriptionTier: subscriptionTier,
              'subscription.status': subscriptionTier,
              'subscription.tier': subscriptionTier,
              'subscription.stripeSubscriptionId': subscription.id,
              'subscription.stripeCustomerId': subscription.customer,
              updatedAt: new Date()
            });
            
            console.log('✅ Firebase user subscription created successfully');
          } catch (error) {
            console.error('❌ Failed to update Firebase user subscription:', error);
          }
        }
        break;

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object as Stripe.Subscription;
        console.log('📝 Subscription updated:', updatedSubscription.id);
        console.log('📊 New status:', updatedSubscription.status);
        
        // Update Firebase user subscription status
        if (updatedSubscription.metadata?.userId) {
          try {
            const { doc, updateDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');
            
            if (!db) {
              console.error('❌ Firebase not initialized in webhook');
              return NextResponse.json({ error: 'Firebase not available' }, { status: 500 });
            }
            
            const userDocRef = doc(db, 'users', updatedSubscription.metadata.userId);
            
            await updateDoc(userDocRef, {
              subscriptionStatus: updatedSubscription.status,
              'subscription.status': updatedSubscription.status,
              updatedAt: new Date()
            });
            
            console.log('✅ Firebase user subscription updated successfully');
          } catch (error) {
            console.error('❌ Failed to update Firebase user subscription:', error);
          }
        }
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        console.log('🗑️ Subscription deleted:', deletedSubscription.id);
        
        // Update Firebase user subscription status to inactive
        if (deletedSubscription.metadata?.userId) {
          try {
            const { doc, updateDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');
            
            if (!db) {
              console.error('❌ Firebase not initialized in webhook');
              return NextResponse.json({ error: 'Firebase not available' }, { status: 500 });
            }
            
            const userDocRef = doc(db, 'users', deletedSubscription.metadata.userId);
            
            await updateDoc(userDocRef, {
              subscriptionStatus: 'inactive',
              subscriptionTier: 'free',
              'subscription.status': 'inactive',
              'subscription.tier': 'free',
              updatedAt: new Date()
            });
            
            console.log('✅ Firebase user subscription marked as inactive');
          } catch (error) {
            console.error('❌ Failed to update Firebase user subscription:', error);
          }
        }
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        console.log('💳 Invoice payment succeeded:', invoice.id);
        console.log('👤 Customer ID:', invoice.customer);
        console.log('📅 Subscription ID:', invoice.subscription);
        
        // Update Firebase user subscription status for successful payments
        if (invoice.subscription) {
          try {
            const { doc, updateDoc, getDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');
            
            if (!db) {
              console.error('❌ Firebase not initialized in webhook');
              return NextResponse.json({ error: 'Firebase not available' }, { status: 500 });
            }
            
            // Get subscription details to find user ID
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
            const userId = subscription.metadata?.userId;
            
            if (userId) {
              const userDocRef = doc(db, 'users', userId);
              
              await updateDoc(userDocRef, {
                subscriptionStatus: 'active',
                updatedAt: new Date()
              });
              
              console.log('✅ Firebase user subscription marked as active for successful payment');
            }
          } catch (error) {
            console.error('❌ Failed to update Firebase user subscription for payment:', error);
          }
        }
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        console.log('❌ Invoice payment failed:', failedInvoice.id);
        console.log('👤 Customer ID:', failedInvoice.customer);
        
        // Update Firebase user subscription status for failed payments
        if (failedInvoice.subscription) {
          try {
            const { doc, updateDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');
            
            if (!db) {
              console.error('❌ Firebase not initialized in webhook');
              return NextResponse.json({ error: 'Firebase not available' }, { status: 500 });
            }
            
            // Get subscription details to find user ID
            const subscription = await stripe.subscriptions.retrieve(failedInvoice.subscription as string);
            const userId = subscription.metadata?.userId;
            
            if (userId) {
              const userDocRef = doc(db, 'users', userId);
              
              await updateDoc(userDocRef, {
                subscriptionStatus: 'past_due',
                updatedAt: new Date()
              });
              
              console.log('✅ Firebase user subscription marked as past_due for failed payment');
            }
          } catch (error) {
            console.error('❌ Failed to update Firebase user subscription for failed payment:', error);
          }
        }
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
        console.log('✅ Unhandled event logged - ready for Firebase integration');
    }

    console.log('✅ Webhook processed successfully');
    return NextResponse.json({ 
      received: true, 
      event_type: event.type,
      message: 'Webhook processed successfully - Firebase integration pending'
    });
    
  } catch (error) {
    console.error('❌ Webhook error:', error);
    
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { 
        error: 'Webhook handler failed', 
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
