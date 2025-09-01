import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin-api';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const db = getDb();
    console.log(`🔍 Debugging webhook logs for user: ${userId}`);

    // Get ALL webhook logs for this user
    const webhookLogs = await db.collection('webhookLogs')
      .where('userId', '==', userId)
      .get();

    const logs = [];
    for (const doc of webhookLogs.docs) {
      const log = doc.data();
      logs.push({
        id: doc.id,
        eventType: log.eventType,
        plan: log.plan,
        success: log.success,
        timestamp: log.timestamp,
        status: log.status,
        message: log.message
      });
    }

    // Also check for any webhook logs that might have this user's email
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const userEmail = userData?.email;

    let emailLogs = [];
    if (userEmail) {
      const emailWebhookLogs = await db.collection('webhookLogs')
        .where('email', '==', userEmail)
        .get();

      for (const doc of emailWebhookLogs.docs) {
        const log = doc.data();
        emailLogs.push({
          id: doc.id,
          eventType: log.eventType,
          plan: log.plan,
          success: log.success,
          timestamp: log.timestamp,
          status: log.status,
          message: log.message,
          userId: log.userId
        });
      }
    }

    return NextResponse.json({
      success: true,
      userId,
      userEmail,
      webhookLogs: logs,
      emailWebhookLogs: emailLogs,
      totalLogs: logs.length,
      totalEmailLogs: emailLogs.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error debugging webhook logs:', error);
    return NextResponse.json(
      { error: 'Failed to debug webhook logs', details: error.message },
      { status: 500 }
    );
  }
}
