import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin-api';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { userId, amount, reason } = await request.json();

    if (!userId || !amount || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, amount, reason' },
        { status: 400 }
      );
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json(
        { error: 'Firebase Admin not initialized' },
        { status: 500 }
      );
    }

    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User document not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const currentCreditsUsed = userData?.credits_used || 0;
    const currentCreditsRemaining = userData?.credits_remaining || 0;
    const newCreditsUsed = Math.max(0, currentCreditsUsed - amount);
    const newCreditsRemaining = currentCreditsRemaining + amount;

    // Update Firestore
    await userRef.update({
      credits_used: newCreditsUsed,
      credits_remaining: newCreditsRemaining,
      last_updated: new Date()
    });

    // Log the refund
    await db.collection('creditUsage').add({
      userId,
      amount: -amount,
      feature: `refund: ${reason}`,
      timestamp: new Date(),
      success: true,
      metadata: { reason }
    });

    console.log(`Credits refunded: ${amount} for ${reason} to user ${userId}`);

    return NextResponse.json({ 
      success: true,
      credits_remaining: newCreditsRemaining,
      credits_used: newCreditsUsed
    });

  } catch (error) {
    console.error('Error in refund-credits API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
