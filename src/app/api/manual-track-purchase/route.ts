/**
 * Manual Purchase Tracking API
 * For manually tracking purchases that weren't caught by webhooks
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin-api';

export async function POST(request: NextRequest) {
  try {
    const { trackingCode, amount, userId } = await request.json();

    if (!trackingCode) {
      return NextResponse.json(
        { error: 'Missing trackingCode' },
        { status: 400 }
      );
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    console.log(`📊 Manually tracking purchase for code: ${trackingCode}`);

    // Find the tracking link
    const linkSnapshot = await db.collection('tracking_links')
      .where('code', '==', trackingCode.toUpperCase())
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (linkSnapshot.empty) {
      return NextResponse.json(
        { error: 'Tracking link not found' },
        { status: 404 }
      );
    }

    const linkDoc = linkSnapshot.docs[0];
    const linkData = linkDoc.data();

    // Create tracking event
    await db.collection('tracking_events').add({
      linkId: linkDoc.id,
      linkCode: trackingCode.toUpperCase(),
      eventType: 'paid_subscription',
      userId: userId || 'manual_entry',
      sessionId: 'manual_' + Date.now(),
      amount: amount || 2900, // Default to $29 if not provided
      metadata: {
        source: 'manual_tracking',
        timestamp: new Date().toISOString()
      },
      timestamp: new Date()
    });

    // Update link stats
    const newPaidSubs = (linkData.totalPaidSubscriptions || 0) + 1;
    const newRevenue = (linkData.totalRevenue || 0) + (amount || 2900);
    const totalClicks = linkData.totalClicks || 0;
    
    const updates = {
      totalPaidSubscriptions: newPaidSubs,
      totalRevenue: newRevenue,
      paidConversionRate: totalClicks > 0 ? (newPaidSubs / totalClicks) * 100 : 0,
      updatedAt: new Date()
    };

    await linkDoc.ref.update(updates);

    console.log(`✅ Manually tracked: ${trackingCode} - $${(amount || 2900)/100} - Total: ${newPaidSubs} subs`);

    return NextResponse.json({
      success: true,
      message: `Purchase tracked for ${trackingCode}`,
      stats: {
        totalPaidSubscriptions: newPaidSubs,
        totalRevenue: newRevenue,
        paidConversionRate: updates.paidConversionRate
      }
    });

  } catch (error) {
    console.error('❌ Error manually tracking purchase:', error);
    return NextResponse.json({ error: 'Failed to track purchase' }, { status: 500 });
  }
}
