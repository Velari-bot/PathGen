import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(request: NextRequest) {
  try {
    const { priceId, userId, promoCode, tier } = await request.json();
    const userEmail = request.headers.get('user-email') || 'customer@example.com';

    console.log('🛒 Creating checkout session...');
    console.log('💰 Price ID:', priceId);
    console.log('👤 User ID:', userId);
    console.log('📧 User Email:', userEmail);
    console.log('🎫 Promo Code:', promoCode);
    console.log('🏷️ Tier:', tier);

    if (!priceId || !userId) {
      console.error('❌ Missing required fields:', { priceId, userId });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Handle promo codes based on tier
    let discountId = null;
    if (promoCode) {
      try {
        // Apply tier-specific promo codes
        const couponMap = {
          'free': 'FREETIER_PROMO',
          'paid': 'STANDARD_PROMO', 
          'pro': 'PRO_PROMO'
        };
        
        const couponCode = couponMap[tier as keyof typeof couponMap];
        if (couponCode) {
          // Verify coupon exists in Stripe
          const coupons = await stripe.coupons.list({ limit: 100 });
          const coupon = coupons.data.find(c => c.id === couponCode);
          
          if (coupon) {
            discountId = coupon.id;
            console.log('✅ Promo code applied:', couponCode);
          } else {
            console.log('⚠️ Coupon not found in Stripe:', couponCode);
          }
        }
      } catch (error) {
        console.warn('⚠️ Error applying promo code:', error);
      }
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
        promoCode: promoCode || null,
        tier: tier || null,
      },
      subscription_data: {
        metadata: {
          userId: userId,
          promoCode: promoCode || null,
          tier: tier || null,
        },
        // Apply discount if promo code is valid
        ...(discountId && { discount: discountId }),
      },
      customer_email: userEmail,
      // Allow customers to enter promo codes
      allow_promotion_codes: true,
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
