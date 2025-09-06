import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin-api';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 use-credits API called');
    console.log('Request URL:', request.url);
    console.log('Request method:', request.method);
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    
    let body;
    try {
      body = await request.json();
      console.log('Request body:', body);
    } catch (parseError) {
      console.error('❌ Error parsing request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { userId, amount, feature, metadata } = body;

    if (!userId || !amount || !feature) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, amount, feature' },
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

    // Get current user document
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User document not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    
    // Initialize credits if not already done
    let currentCreditsUsed = userData?.credits_used || 0;
    let currentCreditsTotal = userData?.credits_total || 0;
    
    if (!currentCreditsTotal) {
      // Initialize credits based on subscription tier
      const subscriptionTier = userData?.subscriptionTier || 
                              userData?.subscription?.tier || 
                              userData?.tier || 
                              'free';
      
      currentCreditsTotal = (subscriptionTier === 'pro' || subscriptionTier === 'premium') ? 4000 : 250;
      currentCreditsUsed = 0;
      
      console.log(`Initializing credits for user ${userId}: ${currentCreditsTotal} credits (${subscriptionTier} tier)`);
    }
    
    const newCreditsUsed = currentCreditsUsed + amount;
    const newCreditsRemaining = Math.max(0, currentCreditsTotal - newCreditsUsed);

    // Check if user has enough credits
    if (newCreditsRemaining < 0) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 400 }
      );
    }

    // Update Firestore with atomic increment (filter out undefined values)
    const updateData: any = {
      credits_total: currentCreditsTotal,
      credits_used: newCreditsUsed,
      credits_remaining: newCreditsRemaining,
      last_updated: new Date()
    };
    
    await userRef.update(updateData);

    // Log the credit usage (filter out undefined values)
    const creditUsageData: any = {
      userId,
      amount,
      feature,
      timestamp: new Date(),
      success: true
    };
    
    // Only add metadata if it's defined
    if (metadata !== undefined && metadata !== null) {
      creditUsageData.metadata = metadata;
    }
    
    await db.collection('creditUsage').add(creditUsageData);

    console.log(`Credits used: ${amount} for ${feature} by user ${userId}`);

    const response = NextResponse.json({ 
      success: true,
      credits_remaining: newCreditsRemaining,
      credits_used: newCreditsUsed,
      credits_total: currentCreditsTotal
    });
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;

  } catch (error) {
    console.error('❌ Error in use-credits API:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
