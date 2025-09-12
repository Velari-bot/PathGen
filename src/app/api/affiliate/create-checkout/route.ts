/**
 * PathGen Affiliate System - Create Checkout Session API
 * Next.js API route for creating Stripe checkout sessions with affiliate tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getDb } from '@/lib/firebase-admin-api';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(request: NextRequest) {
  try {
    const { priceId, userId, successUrl, cancelUrl, referralCode } = await request.json();

    // Validate required fields
    if (!priceId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: priceId and userId' },
        { status: 400 }
      );
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    console.log(`🛒 Creating checkout session for user: ${userId}`);
    if (referralCode) {
      console.log(`🔗 Referral code provided: ${referralCode}`);
    }

    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data()!;
    let affiliateId: string | undefined;

    // Handle affiliate referral if provided
    if (referralCode) {
      const affiliateSnapshot = await db.collection('affiliates')
        .where('referralCode', '==', referralCode.toUpperCase())
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (!affiliateSnapshot.empty) {
        const affiliate = affiliateSnapshot.docs[0].data();
        
        // Prevent self-referrals
        if (affiliate.userId === userId) {
          console.log(`⚠️ Self-referral attempt blocked for user: ${userId}`);
        } else {
          affiliateId = affiliateSnapshot.docs[0].id;
          console.log(`✅ Valid referral found. Affiliate ID: ${affiliateId}`);
          
          // Track the referral click
          await db.collection('affiliate_clicks').add({
            affiliateId,
            userId,
            referralCode: referralCode.toUpperCase(),
            timestamp: new Date(),
            userAgent: request.headers.get('user-agent') || 'unknown',
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            source: 'checkout_creation'
          });
        }
      } else {
        console.log(`❌ Invalid or inactive referral code: ${referralCode}`);
      }
    }

    // Get or create Stripe customer
    let customerId = userData.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userData.email,
        name: userData.displayName || userData.email?.split('@')[0] || 'User',
        metadata: {
          userId,
          source: 'pathgen_affiliate_checkout'
        }
      });
      
      customerId = customer.id;
      
      // Update user with customer ID
      await db.collection('users').doc(userId).update({
        stripeCustomerId: customerId,
        updatedAt: new Date()
      });
    }

    // Create checkout session metadata
    const sessionMetadata: Record<string, string> = {
      userId,
      source: 'pathgen_affiliate_checkout'
    };

    // Add affiliate tracking to metadata
    if (affiliateId) {
      sessionMetadata.affiliate_id = affiliateId;
      sessionMetadata.referral_code = referralCode.toUpperCase();
      console.log(`🎯 Adding affiliate tracking to checkout session`);
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1
      }],
      mode: 'subscription',
      success_url: successUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/pricing?canceled=true`,
      metadata: sessionMetadata,
      subscription_data: {
        metadata: sessionMetadata
      },
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto'
      },
      allow_promotion_codes: true,
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60) // 30 minutes
    });

    console.log(`✅ Checkout session created: ${session.id}`);
    if (affiliateId) {
      console.log(`🎯 Affiliate tracking enabled for session: ${session.id}`);
    }

    return NextResponse.json({
      sessionId: session.id,
      url: session.url!,
      affiliateTracked: !!affiliateId,
      referralCode: affiliateId ? referralCode.toUpperCase() : undefined
    });

  } catch (error) {
    console.error('❌ Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
