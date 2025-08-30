import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    console.log('🔍 Testing webhook for session:', sessionId);

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('📋 Session data:', JSON.stringify(session, null, 2));

    // Check if payment was successful
    if (session.payment_status === 'paid') {
      console.log('✅ Payment was successful');
      
      // Check if subscription was created
      if (session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        console.log('📋 Subscription data:', JSON.stringify(subscription, null, 2));
        
        return NextResponse.json({
          success: true,
          paymentStatus: session.payment_status,
          subscriptionStatus: subscription.status,
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          metadata: subscription.metadata
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'No subscription found in session',
          paymentStatus: session.payment_status
        });
      }
    } else {
      return NextResponse.json({
        success: false,
        error: 'Payment not completed',
        paymentStatus: session.payment_status
      });
    }

  } catch (error) {
    console.error('❌ Test webhook error:', error);
    return NextResponse.json({ error: 'Test webhook failed' }, { status: 500 });
  }
}
