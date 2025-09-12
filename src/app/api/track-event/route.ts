/**
 * Track Events API - Records clicks, signups, and paid subscriptions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin-api';

export async function POST(request: NextRequest) {
  try {
    const { 
      trackingCode, 
      eventType, 
      userId, 
      sessionId, 
      amount,
      metadata 
    } = await request.json();

    if (!trackingCode || !eventType) {
      return NextResponse.json(
        { error: 'Missing trackingCode or eventType' },
        { status: 400 }
      );
    }

    if (!['click', 'signup', 'paid_subscription'].includes(eventType)) {
      return NextResponse.json(
        { error: 'Invalid eventType' },
        { status: 400 }
      );
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    console.log(`📊 Tracking event: ${eventType} for code: ${trackingCode}`);

    // Find the tracking link
    const linkSnapshot = await db.collection('tracking_links')
      .where('code', '==', trackingCode.toUpperCase())
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (linkSnapshot.empty) {
      console.log(`⚠️ Invalid tracking code: ${trackingCode}`);
      return NextResponse.json(
        { error: 'Invalid tracking code' },
        { status: 404 }
      );
    }

    const linkDoc = linkSnapshot.docs[0];
    const linkId = linkDoc.id;

    // Create tracking event
    const eventData = {
      linkId,
      linkCode: trackingCode.toUpperCase(),
      eventType,
      userId: userId || null,
      sessionId: sessionId || null,
      amount: amount || null,
      metadata: {
        userAgent: request.headers.get('user-agent') || 'unknown',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        referrer: request.headers.get('referer') || 'unknown',
        ...metadata
      },
      timestamp: new Date()
    };

    await db.collection('tracking_events').add(eventData);

    // Update link stats (increment counters)
    const updates: any = {
      updatedAt: new Date()
    };

    switch (eventType) {
      case 'click':
        updates.totalClicks = (linkDoc.data().totalClicks || 0) + 1;
        break;
      case 'signup':
        updates.totalSignups = (linkDoc.data().totalSignups || 0) + 1;
        break;
      case 'paid_subscription':
        updates.totalPaidSubscriptions = (linkDoc.data().totalPaidSubscriptions || 0) + 1;
        updates.totalRevenue = (linkDoc.data().totalRevenue || 0) + (amount || 0);
        break;
    }

    // Recalculate conversion rates
    const currentData = linkDoc.data();
    const newClicks = updates.totalClicks ?? currentData.totalClicks ?? 0;
    const newSignups = updates.totalSignups ?? currentData.totalSignups ?? 0;
    const newPaidSubs = updates.totalPaidSubscriptions ?? currentData.totalPaidSubscriptions ?? 0;

    if (newClicks > 0) {
      updates.conversionRate = (newSignups / newClicks) * 100;
      updates.paidConversionRate = (newPaidSubs / newClicks) * 100;
    }

    await linkDoc.ref.update(updates);

    console.log(`✅ Event tracked: ${eventType} for link: ${linkId}`);

    return NextResponse.json({
      success: true,
      message: 'Event tracked successfully'
    });

  } catch (error) {
    console.error('❌ Error tracking event:', error);
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 });
  }
}
