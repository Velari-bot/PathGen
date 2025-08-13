import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(request: NextRequest) {
  try {
    const { priceId, userId } = await request.json();
    const userEmail = request.headers.get('user-email') || 'customer@example.com';

    console.log('🛒 Creating checkout session...');
    console.log('💰 Price ID:', priceId);
    console.log('👤 User ID:', userId);
    console.log('📧 User Email:', userEmail);

    if (!priceId || !userId) {
      console.error('❌ Missing required fields:', { priceId, userId });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing?canceled=true`,
      metadata: {
        userId: userId,
      },
      subscription_data: {
        metadata: {
          userId: userId,
        },
      },
      customer_email: userEmail,
    });

    console.log('✅ Checkout session created successfully');
    console.log('🆔 Session ID:', session.id);
    console.log('🔗 Checkout URL:', session.url);
    console.log('📋 Session metadata:', session.metadata);

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('❌ Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
