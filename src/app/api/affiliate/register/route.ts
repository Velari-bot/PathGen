/**
 * PathGen Affiliate Registration API
 * Allows users to sign up as affiliates
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin-api';

/**
 * Generate a unique referral code
 */
function generateReferralCode(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Check if a referral code is unique
 */
async function isReferralCodeUnique(code: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  
  const snapshot = await db.collection('affiliates')
    .where('referralCode', '==', code)
    .limit(1)
    .get();
  
  return snapshot.empty;
}

/**
 * Create a unique referral code
 */
async function createUniqueReferralCode(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const code = generateReferralCode();
    if (await isReferralCodeUnique(code)) {
      return code;
    }
    attempts++;
  }
  
  throw new Error('Failed to generate unique referral code');
}

export async function POST(request: NextRequest) {
  try {
    const { userId, email, displayName, paymentMethod, paymentDetails } = await request.json();

    // Validate required fields
    if (!userId || !email || !displayName || !paymentMethod || !paymentDetails) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate payment method
    if (!['paypal', 'stripe', 'bank_transfer'].includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
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

    console.log(`📝 Registering new affiliate for user: ${userId}`);

    // Check if user is already an affiliate
    const existingAffiliate = await db.collection('affiliates')
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (!existingAffiliate.empty) {
      const existing = existingAffiliate.docs[0].data();
      return NextResponse.json(
        { 
          error: 'User is already an affiliate',
          existingReferralCode: existing.referralCode
        },
        { status: 409 }
      );
    }

    // Generate unique referral code
    const referralCode = await createUniqueReferralCode();

    // Create affiliate record
    const affiliateData = {
      userId,
      email,
      displayName,
      referralCode,
      totalEarnings: 0,
      pendingEarnings: 0,
      paidEarnings: 0,
      totalReferrals: 0,
      commissionRate: 0.15, // 15% default commission
      status: 'active',
      paymentInfo: {
        method: paymentMethod,
        details: paymentDetails
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const affiliateRef = await db.collection('affiliates').add(affiliateData);

    console.log(`✅ New affiliate registered: ${affiliateRef.id} with code: ${referralCode}`);

    // Create initial stats document
    const today = new Date().toISOString().split('T')[0];
    await db.collection('affiliate_stats').doc(`${affiliateRef.id}_${today}`).set({
      affiliateId: affiliateRef.id,
      period: 'daily',
      date: today,
      clicks: 0,
      conversions: 0,
      conversionRate: 0,
      totalEarnings: 0,
      averageOrderValue: 0,
      topProducts: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      affiliateId: affiliateRef.id,
      referralCode,
      status: 'active',
      message: 'Successfully registered as affiliate',
      referralUrl: `${process.env.NEXT_PUBLIC_BASE_URL}?ref=${referralCode}`
    });

  } catch (error) {
    console.error('❌ Error registering affiliate:', error);
    return NextResponse.json(
      { error: 'Failed to register affiliate' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
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

    // Check if user is already an affiliate
    const affiliateSnapshot = await db.collection('affiliates')
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (affiliateSnapshot.empty) {
      return NextResponse.json({
        isAffiliate: false,
        message: 'User is not an affiliate'
      });
    }

    const affiliate = affiliateSnapshot.docs[0].data();
    
    return NextResponse.json({
      isAffiliate: true,
      affiliate: {
        id: affiliateSnapshot.docs[0].id,
        referralCode: affiliate.referralCode,
        status: affiliate.status,
        totalEarnings: affiliate.totalEarnings,
        pendingEarnings: affiliate.pendingEarnings,
        totalReferrals: affiliate.totalReferrals,
        commissionRate: affiliate.commissionRate
      }
    });

  } catch (error) {
    console.error('❌ Error checking affiliate status:', error);
    return NextResponse.json(
      { error: 'Failed to check affiliate status' },
      { status: 500 }
    );
  }
}
