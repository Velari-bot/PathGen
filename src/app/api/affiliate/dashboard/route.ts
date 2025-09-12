/**
 * PathGen Affiliate Dashboard API
 * Provides affiliate performance data and earnings information
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin-api';

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

    console.log(`📊 Getting affiliate dashboard for user: ${userId}`);

    // Get affiliate data
    const affiliateSnapshot = await db.collection('affiliates')
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (affiliateSnapshot.empty) {
      return NextResponse.json(
        { error: 'Affiliate not found' },
        { status: 404 }
      );
    }

    const affiliate = affiliateSnapshot.docs[0].data();
    const affiliateId = affiliateSnapshot.docs[0].id;

    // Get recent earnings (last 10)
    const earningsSnapshot = await db.collection('affiliate_earnings')
      .where('affiliateId', '==', affiliateId)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const recentEarnings = earningsSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
    }));

    // Get monthly stats
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const statsSnapshot = await db.collection('affiliate_stats')
      .where('affiliateId', '==', affiliateId)
      .where('date', '>=', currentMonth + '-01')
      .get();

    const monthlyStats = {
      conversions: 0,
      earnings: 0,
      clicks: 0,
      conversionRate: 0
    };

    statsSnapshot.docs.forEach((doc: any) => {
      const stat = doc.data();
      monthlyStats.conversions += stat.conversions || 0;
      monthlyStats.earnings += stat.totalEarnings || 0;
      monthlyStats.clicks += stat.clicks || 0;
    });

    // Calculate conversion rate
    if (monthlyStats.clicks > 0) {
      monthlyStats.conversionRate = (monthlyStats.conversions / monthlyStats.clicks) * 100;
    }

    // Get earnings by status
    const earningsByStatus = await Promise.all([
      db.collection('affiliate_earnings')
        .where('affiliateId', '==', affiliateId)
        .where('status', '==', 'pending')
        .get(),
      db.collection('affiliate_earnings')
        .where('affiliateId', '==', affiliateId)
        .where('status', '==', 'approved')
        .get(),
      db.collection('affiliate_earnings')
        .where('affiliateId', '==', affiliateId)
        .where('status', '==', 'paid')
        .get()
    ]);

    const [pendingEarnings, approvedEarnings, paidEarnings] = earningsByStatus;

    const earningsBreakdown = {
      pending: {
        count: pendingEarnings.size,
        amount: pendingEarnings.docs.reduce((sum: number, doc: any) => sum + (doc.data().amountEarned || 0), 0)
      },
      approved: {
        count: approvedEarnings.size,
        amount: approvedEarnings.docs.reduce((sum: number, doc: any) => sum + (doc.data().amountEarned || 0), 0)
      },
      paid: {
        count: paidEarnings.size,
        amount: paidEarnings.docs.reduce((sum: number, doc: any) => sum + (doc.data().amountEarned || 0), 0)
      }
    };

    // Get recent clicks
    const clicksSnapshot = await db.collection('affiliate_clicks')
      .where('affiliateId', '==', affiliateId)
      .orderBy('timestamp', 'desc')
      .limit(20)
      .get();

    const recentClicks = clicksSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp
    }));

    // Calculate performance metrics
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const performanceMetrics = {
      totalClicks: recentClicks.length,
      totalConversions: monthlyStats.conversions,
      conversionRate: monthlyStats.conversionRate,
      averageOrderValue: monthlyStats.conversions > 0 ? monthlyStats.earnings / monthlyStats.conversions : 0,
      earningsThisMonth: monthlyStats.earnings
    };

    return NextResponse.json({
      affiliate: {
        id: affiliateId,
        referralCode: affiliate.referralCode,
        status: affiliate.status,
        totalEarnings: affiliate.totalEarnings || 0,
        pendingEarnings: affiliate.pendingEarnings || 0,
        paidEarnings: affiliate.paidEarnings || 0,
        totalReferrals: affiliate.totalReferrals || 0,
        commissionRate: affiliate.commissionRate || 0.15,
        paymentInfo: affiliate.paymentInfo,
        createdAt: affiliate.createdAt?.toDate?.() || affiliate.createdAt
      },
      recentEarnings,
      monthlyStats,
      earningsBreakdown,
      recentClicks,
      performanceMetrics,
      referralUrl: `${process.env.NEXT_PUBLIC_BASE_URL}?ref=${affiliate.referralCode}`,
      payoutThreshold: 5000, // $50.00 minimum payout in cents
      nextPayoutDate: getNextPayoutDate()
    });

  } catch (error) {
    console.error('❌ Error getting affiliate dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to get affiliate dashboard' },
      { status: 500 }
    );
  }
}

/**
 * Calculate next payout date (e.g., monthly on the 1st)
 */
function getNextPayoutDate(): string {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.toISOString().split('T')[0];
}
