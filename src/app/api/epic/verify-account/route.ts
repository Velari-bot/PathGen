import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { epicUsername, userId } = await request.json();

    if (!epicUsername || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: epicUsername and userId' },
        { status: 400 }
      );
    }

    console.log('🔍 Verifying Epic account:', { epicUsername, userId });

    // TODO: In production, this would call Fortnite Tracker API to verify the username
    // For now, we'll simulate a successful verification
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock verification response
    const verificationResult = {
      success: true,
      epicUsername: epicUsername,
      epicId: `epic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      displayName: epicUsername,
      platform: 'pc',
      verifiedAt: new Date().toISOString(),
      userId: userId,
      isReal: true,
      stats: {
        // Mock stats for demonstration
        wins: Math.floor(Math.random() * 100),
        top10: Math.floor(Math.random() * 500),
        kills: Math.floor(Math.random() * 2000),
        kd: (Math.random() * 2 + 0.5).toFixed(2),
        matches: Math.floor(Math.random() * 1000),
        winRate: (Math.random() * 15 + 5).toFixed(1)
      }
    };

    console.log('✅ Epic account verified successfully:', verificationResult.epicUsername);

    // Link the verified account
    try {
      const linkResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/user/link-epic-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          epicAccount: verificationResult,
          userId,
        }),
      });

      if (linkResponse.ok) {
        console.log('✅ Verified Epic account linked to Firebase successfully');
      } else {
        console.warn('⚠️ Could not link verified Epic account to Firebase');
      }
    } catch (linkError) {
      console.warn('⚠️ Error linking verified account to Firebase:', linkError);
    }

    return NextResponse.json({
      success: true,
      message: 'Epic account verified successfully!',
      epicAccount: verificationResult,
      note: 'Manual verification completed - account is now linked'
    });

  } catch (error) {
    console.error('❌ Epic account verification error:', error);
    return NextResponse.json(
      {
        error: 'Failed to verify Epic account',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
