import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';

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
        
        // For now, just log the event - we'll add Firebase integration later
        console.log('✅ Checkout session completed - ready for Firebase integration');
        break;

      case 'customer.subscription.created':
        const subscription = event.data.object as Stripe.Subscription;
        console.log('📅 Subscription created:', subscription.id);
        console.log('👤 User ID from metadata:', subscription.metadata?.userId);
        console.log('✅ Subscription created - ready for Firebase integration');
        break;

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object as Stripe.Subscription;
        console.log('📝 Subscription updated:', updatedSubscription.id);
        console.log('📊 New status:', updatedSubscription.status);
        console.log('✅ Subscription updated - ready for Firebase integration');
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        console.log('🗑️ Subscription deleted:', deletedSubscription.id);
        console.log('✅ Subscription deleted - ready for Firebase integration');
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        console.log('💳 Invoice payment succeeded:', invoice.id);
        console.log('✅ Invoice payment succeeded - ready for Firebase integration');
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        console.log('❌ Invoice payment failed:', failedInvoice.id);
        console.log('✅ Invoice payment failed - ready for Firebase integration');
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
