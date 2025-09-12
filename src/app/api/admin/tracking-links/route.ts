/**
 * Admin API for Managing Tracking Links
 * Create, update, and get analytics for tracking links
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin-api';

// GET - Get all tracking links with stats
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    console.log('📊 Getting all tracking links...');

    // Get all tracking links
    const linksSnapshot = await db.collection('tracking_links').get();
    const links = linksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt
    }));

    // Get stats for each link
    const linksWithStats = await Promise.all(
      links.map(async (link) => {
        const statsSnapshot = await db.collection('tracking_events')
          .where('linkId', '==', link.id)
          .get();

        const events = statsSnapshot.docs.map(doc => doc.data());
        
        const clicks = events.filter(e => e.eventType === 'click').length;
        const signups = events.filter(e => e.eventType === 'signup').length;
        const paidSubs = events.filter(e => e.eventType === 'paid_subscription').length;
        const revenue = events
          .filter(e => e.eventType === 'paid_subscription')
          .reduce((sum, e) => sum + (e.amount || 0), 0);

        return {
          ...link,
          totalClicks: clicks,
          totalSignups: signups,
          totalPaidSubscriptions: paidSubs,
          totalRevenue: revenue,
          conversionRate: clicks > 0 ? (signups / clicks) * 100 : 0,
          paidConversionRate: clicks > 0 ? (paidSubs / clicks) * 100 : 0,
          averageRevenuePerUser: paidSubs > 0 ? revenue / paidSubs : 0
        };
      })
    );

    return NextResponse.json({
      success: true,
      links: linksWithStats,
      summary: {
        totalLinks: linksWithStats.length,
        totalClicks: linksWithStats.reduce((sum, l) => sum + l.totalClicks, 0),
        totalSignups: linksWithStats.reduce((sum, l) => sum + l.totalSignups, 0),
        totalPaidSubs: linksWithStats.reduce((sum, l) => sum + l.totalPaidSubscriptions, 0),
        totalRevenue: linksWithStats.reduce((sum, l) => sum + l.totalRevenue, 0)
      }
    });

  } catch (error) {
    console.error('❌ Error getting tracking links:', error);
    return NextResponse.json({ error: 'Failed to get tracking links' }, { status: 500 });
  }
}

// POST - Create a new tracking link
export async function POST(request: NextRequest) {
  try {
    const { name, code } = await request.json();

    if (!name || !code) {
      return NextResponse.json(
        { error: 'Missing name or code' },
        { status: 400 }
      );
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    console.log(`📝 Creating tracking link: ${name} (${code})`);

    // Check if code already exists
    const existingLink = await db.collection('tracking_links')
      .where('code', '==', code.toUpperCase())
      .limit(1)
      .get();

    if (!existingLink.empty) {
      return NextResponse.json(
        { error: 'Code already exists' },
        { status: 409 }
      );
    }

    // Create the tracking link
    const linkData = {
      name,
      code: code.toUpperCase(),
      url: `${process.env.NEXT_PUBLIC_BASE_URL}?track=${code.toUpperCase()}`,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      totalClicks: 0,
      totalSignups: 0,
      totalPaidSubscriptions: 0,
      totalRevenue: 0,
      conversionRate: 0,
      paidConversionRate: 0
    };

    const docRef = await db.collection('tracking_links').add(linkData);

    console.log(`✅ Created tracking link: ${docRef.id}`);

    return NextResponse.json({
      success: true,
      link: {
        id: docRef.id,
        ...linkData
      }
    });

  } catch (error) {
    console.error('❌ Error creating tracking link:', error);
    return NextResponse.json({ error: 'Failed to create tracking link' }, { status: 500 });
  }
}

// PUT - Update a tracking link
export async function PUT(request: NextRequest) {
  try {
    const { id, name, code, isActive } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing link ID' }, { status: 400 });
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    console.log(`📝 Updating tracking link: ${id}`);

    const updateData: any = {
      updatedAt: new Date()
    };

    if (name) updateData.name = name;
    if (code) {
      // Check if new code conflicts with existing
      const existingLink = await db.collection('tracking_links')
        .where('code', '==', code.toUpperCase())
        .get();
      
      const conflictingLink = existingLink.docs.find(doc => doc.id !== id);
      if (conflictingLink) {
        return NextResponse.json(
          { error: 'Code already exists' },
          { status: 409 }
        );
      }
      
      updateData.code = code.toUpperCase();
      updateData.url = `${process.env.NEXT_PUBLIC_BASE_URL}?track=${code.toUpperCase()}`;
    }
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    await db.collection('tracking_links').doc(id).update(updateData);

    console.log(`✅ Updated tracking link: ${id}`);

    return NextResponse.json({
      success: true,
      message: 'Link updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating tracking link:', error);
    return NextResponse.json({ error: 'Failed to update tracking link' }, { status: 500 });
  }
}

// DELETE - Delete a tracking link and its associated events
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing link ID' }, { status: 400 });
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    console.log(`🗑️ Deleting tracking link: ${id}`);

    // Delete all tracking events for this link
    const eventsSnapshot = await db.collection('tracking_events')
      .where('linkId', '==', id)
      .get();

    const batch = db.batch();
    
    // Add all tracking events to the batch delete
    eventsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Add the tracking link to the batch delete
    batch.delete(db.collection('tracking_links').doc(id));

    // Execute the batch delete
    await batch.commit();

    console.log(`✅ Deleted tracking link and ${eventsSnapshot.docs.length} associated events: ${id}`);

    return NextResponse.json({
      success: true,
      message: `Link deleted successfully (removed ${eventsSnapshot.docs.length} events)`
    });

  } catch (error) {
    console.error('❌ Error deleting tracking link:', error);
    return NextResponse.json({ error: 'Failed to delete tracking link' }, { status: 500 });
  }
}
