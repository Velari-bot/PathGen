import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      rating, 
      feedback, 
      context, 
      timestamp, 
      userAgent, 
      url 
    } = body;

    if (!rating || !feedback) {
      return NextResponse.json(
        { error: 'Rating and feedback are required' },
        { status: 400 }
      );
    }

    // Save feedback to Firebase
    await db.collection('feedback').add({
      userId: userId || 'anonymous',
      rating,
      feedback,
      context: context || 'general',
      timestamp: timestamp || new Date().toISOString(),
      userAgent,
      url,
      environment: process.env.NODE_ENV || 'development',
      status: 'new'
    });

    // Send notification email for low ratings
    if (rating <= 2) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/send-notification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'low_rating_alert',
            data: {
              rating,
              feedback,
              context,
              userId,
              timestamp
            }
          })
        });
      } catch (error) {
        console.error('Failed to send low rating notification:', error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback submission failed:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const context = searchParams.get('context');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = db.collection('feedback').orderBy('timestamp', 'desc').limit(limit);
    
    if (context) {
      query = query.where('context', '==', context);
    }

    const snapshot = await query.get();
    const feedback = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Failed to fetch feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}
