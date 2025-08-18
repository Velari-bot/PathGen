import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const epicUsername = searchParams.get('username');
    const epicId = searchParams.get('epicId');
    const platform = searchParams.get('platform') || 'pc';

    if (!epicUsername && !epicId) {
      return NextResponse.json(
        { error: 'Missing required parameter: username or epicId' },
        { status: 400 }
      );
    }

    console.log('🎯 Fetching Fortnite stats:', { epicUsername, epicId, platform });

    // TODO: In production, this would call Fortnite Tracker API
    // For now, we'll return mock data
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock Fortnite stats response
    const fortniteStats = {
      success: true,
      account: {
        id: epicId || `epic-${Date.now()}`,
        name: epicUsername || 'EpicUser123',
        platform: platform
      },
      stats: {
        all: {
          wins: Math.floor(Math.random() * 100) + 10,
          top10: Math.floor(Math.random() * 500) + 100,
          kills: Math.floor(Math.random() * 2000) + 500,
          kd: (Math.random() * 2 + 0.5).toFixed(2),
          matches: Math.floor(Math.random() * 1000) + 200,
          winRate: (Math.random() * 15 + 5).toFixed(1),
          avgPlace: (Math.random() * 50 + 25).toFixed(1),
          avgKills: (Math.random() * 3 + 1).toFixed(2)
        }
      },
      recentMatches: [
        {
          id: 'match-1',
          date: new Date(Date.now() - 3600000).toISOString(),
          placement: Math.floor(Math.random() * 100) + 1,
          kills: Math.floor(Math.random() * 10),
          mode: 'solo'
        },
        {
          id: 'match-2',
          date: new Date(Date.now() - 7200000).toISOString(),
          placement: Math.floor(Math.random() * 100) + 1,
          kills: Math.floor(Math.random() * 10),
          mode: 'solo'
        }
      ],
      preferences: {
        preferredDrop: 'Tilted Towers',
        weakestZone: 'Building',
        bestWeapon: 'Assault Rifle',
        avgSurvivalTime: '12:34'
      },
      fallback: {
        manualCheckUrl: `https://fortnitetracker.com/profile/${platform}/${epicUsername || 'username'}`,
        instructions: 'Visit Fortnite Tracker to verify your stats',
        manualStatsForm: {
          kd: '1.5',
          winRate: '8.2',
          matches: '500',
          avgPlace: '35.2'
        }
      },
      osirionData: {
        totalMatches: Math.floor(Math.random() * 1000) + 200,
        assists: Math.floor(Math.random() * 100) + 20,
        events: Math.floor(Math.random() * 50) + 10
      },
      usage: {
        current: 1,
        limit: 100,
        resetDate: new Date(Date.now() + 2592000000).toISOString() // 30 days from now
      }
    };

    console.log('✅ Fortnite stats retrieved successfully for:', epicUsername || epicId);

    return NextResponse.json(fortniteStats);

  } catch (error) {
    console.error('❌ Error fetching Fortnite stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch Fortnite stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { epicUsername, epicId, platform = 'pc' } = await request.json();

    if (!epicUsername && !epicId) {
      return NextResponse.json(
        { error: 'Missing required field: epicUsername or epicId' },
        { status: 400 }
      );
    }

    console.log('🎯 Fetching Fortnite stats (POST):', { epicUsername, epicId, platform });

    // TODO: In production, this would call Fortnite Tracker API
    // For now, we'll return mock data
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock Fortnite stats response
    const fortniteStats = {
      success: true,
      account: {
        id: epicId || `epic-${Date.now()}`,
        name: epicUsername || 'EpicUser123',
        platform: platform
      },
      stats: {
        all: {
          wins: Math.floor(Math.random() * 100) + 10,
          top10: Math.floor(Math.random() * 500) + 100,
          kills: Math.floor(Math.random() * 2000) + 500,
          kd: (Math.random() * 2 + 0.5).toFixed(2),
          matches: Math.floor(Math.random() * 1000) + 200,
          winRate: (Math.random() * 15 + 5).toFixed(1),
          avgPlace: (Math.random() * 50 + 25).toFixed(1),
          avgKills: (Math.random() * 3 + 1).toFixed(2)
        }
      },
      recentMatches: [
        {
          id: 'match-1',
          date: new Date(Date.now() - 3600000).toISOString(),
          placement: Math.floor(Math.random() * 100) + 1,
          kills: Math.floor(Math.random() * 10),
          mode: 'solo'
        },
        {
          id: 'match-2',
          date: new Date(Date.now() - 7200000).toISOString(),
          placement: Math.floor(Math.random() * 100) + 1,
          kills: Math.floor(Math.random() * 10),
          mode: 'solo'
        }
      ],
      preferences: {
        preferredDrop: 'Tilted Towers',
        weakestZone: 'Building',
        bestWeapon: 'Assault Rifle',
        avgSurvivalTime: '12:34'
      },
      fallback: {
        manualCheckUrl: `https://fortnitetracker.com/profile/${platform}/${epicUsername || 'username'}`,
        instructions: 'Visit Fortnite Tracker to verify your stats',
        manualStatsForm: {
          kd: '1.5',
          winRate: '8.2',
          matches: '500',
          avgPlace: '35.2'
        }
      },
      osirionData: {
        totalMatches: Math.floor(Math.random() * 1000) + 200,
        assists: Math.floor(Math.random() * 100) + 20,
        events: Math.floor(Math.random() * 50) + 10
      },
      usage: {
        current: 1,
        limit: 100,
        resetDate: new Date(Date.now() + 2592000000).toISOString() // 30 days from now
      }
    };

    console.log('✅ Fortnite stats retrieved successfully (POST) for:', epicUsername || epicId);

    return NextResponse.json(fortniteStats);

  } catch (error) {
    console.error('❌ Error fetching Fortnite stats (POST):', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch Fortnite stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
