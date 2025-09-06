import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { componentName, metrics, timestamp, url, slowCall, error } = body;

    // Log performance metrics to Firebase
    await db.collection('performanceLogs').add({
      componentName,
      metrics,
      timestamp: timestamp || new Date().toISOString(),
      url,
      slowCall: slowCall || false,
      error: error || null,
      environment: process.env.NODE_ENV || 'development'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Performance logging failed:', error);
    return NextResponse.json(
      { error: 'Failed to log performance metrics' },
      { status: 500 }
    );
  }
}
