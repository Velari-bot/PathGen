import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { error, stack, componentStack, timestamp, userAgent, url } = body;

    // Log error to Firebase
    await db.collection('errorLogs').add({
      error: error,
      stack: stack,
      componentStack: componentStack,
      timestamp: timestamp || new Date().toISOString(),
      userAgent: userAgent,
      url: url,
      severity: 'error',
      environment: process.env.NODE_ENV || 'development'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging failed:', error);
    return NextResponse.json(
      { error: 'Failed to log error' },
      { status: 500 }
    );
  }
}
