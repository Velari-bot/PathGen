import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin-api';

export async function GET() {
  try {
    const db = getDb();
    console.log(`🔍 Debugging ALL webhook logs`);

    // Get ALL webhook logs
    const webhookLogs = await db.collection('webhookLogs')
      .limit(50) // Limit to avoid timeout
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
        message: log.message,
        userId: log.userId,
        email: log.email
      });
    }

    // Filter for pro subscriptions
    const proLogs = logs.filter(log => log.plan === 'pro');
    const successfulProLogs = proLogs.filter(log => log.success === true);

    return NextResponse.json({
      success: true,
      totalLogs: logs.length,
      proLogs: proLogs.length,
      successfulProLogs: successfulProLogs.length,
      allLogs: logs,
      proLogsDetails: successfulProLogs,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error debugging all webhook logs:', error);
    return NextResponse.json(
      { error: 'Failed to debug all webhook logs', details: error.message },
      { status: 500 }
    );
  }
}
