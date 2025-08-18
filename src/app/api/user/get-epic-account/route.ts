import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      );
    }

    console.log('🔍 Getting Epic account for user:', userId);

    // TODO: In production, this would fetch from Firebase Firestore
    // For now, we'll return a mock response
    
    // Simulate database lookup delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock Epic account data
    const epicAccount = {
      epicId: `epic-${userId}-${Date.now()}`,
      displayName: 'EpicUser123',
      platform: 'pc',
      linkedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      userId: userId,
      isReal: true,
      lastUpdated: new Date().toISOString(),
      stats: {
        wins: 45,
        top10: 234,
        kills: 1234,
        kd: 1.87,
        matches: 567,
        winRate: 7.9
      }
    };

    console.log('✅ Epic account retrieved successfully for user:', userId);

    return NextResponse.json({
      success: true,
      epicAccount: epicAccount,
      message: 'Epic account retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error getting Epic account:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve Epic account',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      );
    }

    console.log('🔍 Getting Epic account for user (POST):', userId);

    // TODO: In production, this would fetch from Firebase Firestore
    // For now, we'll return a mock response
    
    // Simulate database lookup delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock Epic account data
    const epicAccount = {
      epicId: `epic-${userId}-${Date.now()}`,
      displayName: 'EpicUser123',
      platform: 'pc',
      linkedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      userId: userId,
      isReal: true,
      lastUpdated: new Date().toISOString(),
      stats: {
        wins: 45,
        top10: 234,
        kills: 1234,
        kd: 1.87,
        matches: 567,
        winRate: 7.9
      }
    };

    console.log('✅ Epic account retrieved successfully for user (POST):', userId);

    return NextResponse.json({
      success: true,
      epicAccount: epicAccount,
      message: 'Epic account retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error getting Epic account (POST):', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve Epic account',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
