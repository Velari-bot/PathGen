import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin-api';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

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
        { error: 'Firebase Admin not initialized' },
        { status: 500 }
      );
    }

    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    
    // Check if user has credits initialized
    if (!userData?.credits_total) {
      // Initialize credits based on subscription tier
      let creditsTotal = 250; // Default to free tier
      
      // Check subscription status
      const subscriptionTier = userData?.subscriptionTier || 
                              userData?.subscription?.tier || 
                              userData?.tier || 
                              'free';
      
      if (subscriptionTier === 'pro' || subscriptionTier === 'premium') {
        creditsTotal = 4000; // Pro tier
      }
      
      // Initialize the user's credits
      const initialCredits = {
        credits_total: creditsTotal,
        credits_used: 0,
        credits_remaining: creditsTotal,
        last_updated: new Date()
      };
      
      await userRef.update(initialCredits);
      
      console.log(`Initialized credits for user ${userId}: ${creditsTotal} credits (${subscriptionTier} tier)`);
      
      return NextResponse.json({ credits: initialCredits });
    }

    const credits = {
      credits_total: userData?.credits_total || 0,
      credits_used: userData?.credits_used || 0,
      credits_remaining: userData?.credits_remaining || 0,
      last_updated: userData?.last_updated?.toDate() || new Date()
    };

    return NextResponse.json({ credits });

  } catch (error) {
    console.error('Error in get-credits API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
