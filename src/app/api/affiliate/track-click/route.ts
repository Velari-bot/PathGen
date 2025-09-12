/**
 * PathGen Affiliate Click Tracking API
 * Records when someone clicks an affiliate link
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin-api';

export async function POST(request: NextRequest) {
  try {
    const { referralCode, userAgent, timestamp, page } = await request.json();

    if (!referralCode) {
      return NextResponse.json(
        { error: 'Missing referral code' },
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

    console.log(`👆 Tracking click for referral code: ${referralCode}`);

    // Find the affiliate by referral code
    const affiliateSnapshot = await db.collection('affiliates')
      .where('referralCode', '==', referralCode.toUpperCase())
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (affiliateSnapshot.empty) {
      console.log(`⚠️ Invalid referral code: ${referralCode}`);
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 404 }
      );
    }

    const affiliateId = affiliateSnapshot.docs[0].id;

    // Record the click
    await db.collection('affiliate_clicks').add({
      affiliateId,
      referralCode: referralCode.toUpperCase(),
      timestamp: new Date(timestamp),
      userAgent: userAgent || 'unknown',
      ipAddress: request.ip || 'unknown',
      page: page || '/',
      source: 'referral_link'
    });

    // Update daily stats
    const today = new Date().toISOString().split('T')[0];
    const statsRef = db.collection('affiliate_stats').doc(`${affiliateId}_${today}`);
    
    const statsDoc = await statsRef.get();
    if (statsDoc.exists) {
      await statsRef.update({
        clicks: (statsDoc.data()?.clicks || 0) + 1,
        updatedAt: new Date()
      });
    } else {
      await statsRef.set({
        affiliateId,
        period: 'daily',
        date: today,
        clicks: 1,
        conversions: 0,
        conversionRate: 0,
        totalEarnings: 0,
        averageOrderValue: 0,
        topProducts: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    console.log(`✅ Click tracked for affiliate: ${affiliateId}`);

    return NextResponse.json({
      success: true,
      message: 'Click tracked successfully'
    });

  } catch (error) {
    console.error('❌ Error tracking click:', error);
    return NextResponse.json(
      { error: 'Failed to track click' },
      { status: 500 }
    );
  }
}
