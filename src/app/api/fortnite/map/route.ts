import { NextRequest, NextResponse } from 'next/server';

const FORTNITE_API_KEY = process.env.FORTNITE_API_KEY;
const FORTNITE_API_BASE_URL = 'https://fortniteapi.io/v2';

export async function GET(request: NextRequest) {
  try {
    if (!FORTNITE_API_KEY) {
      return NextResponse.json(
        { error: 'Fortnite API key not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const season = searchParams.get('season') || 'current';

    // Fetch map data from fortniteapi.io
    const response = await fetch(`${FORTNITE_API_BASE_URL}/map`, {
      headers: {
        'Authorization': FORTNITE_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Fortnite API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform the data to match your app's format
    const transformedPOIs = data.pois?.map((poi: any) => ({
      id: poi.id || Math.random().toString(36).substr(2, 9),
      name: poi.name || 'Unknown POI',
      description: poi.description || 'No description available',
      type: poi.type || 'Landmark',
      image: poi.image || `/api/placeholder?width=300&height=200&bgColor=4A90E2&text=${encodeURIComponent(poi.name || 'POI')}`,
      coordinates: {
        x: poi.x || 0,
        y: poi.y || 0,
      },
      rarity: poi.rarity || 'Common',
      lootQuality: poi.lootQuality || 'Medium',
      playerTraffic: poi.playerTraffic || 'Medium',
      rotation: poi.rotation || 'Random',
      season: poi.season || 'Current',
      specialFeatures: poi.specialFeatures || [],
      strategies: poi.strategies || {
        drop: 'Standard drop strategy',
        rotation: 'Standard rotation',
        endgame: 'Standard endgame positioning'
      }
    })) || [];

    return NextResponse.json({
      success: true,
      data: {
        pois: transformedPOIs,
        currentSeason: data.currentSeason || 'Chapter 6 Season 4',
        mapVersion: data.mapVersion || '1.0',
        lastUpdate: data.lastUpdate || new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching Fortnite map data:', error);
    
    // Return mock data as fallback
    const mockPOIs = [
      {
        id: '1',
        name: 'Lazy Lagoon',
        description: 'A tropical paradise with high-tier loot and strategic positioning',
        type: 'Named Location',
        image: '/api/placeholder?width=300&height=200&bgColor=4A90E2&text=Lazy+Lagoon',
        coordinates: { x: 45, y: 75 },
        rarity: 'Rare',
        lootQuality: 'High',
        playerTraffic: 'Medium',
        rotation: 'Clockwise',
        season: 'Chapter 6 Season 4',
        specialFeatures: ['Water mechanics', 'High ground advantage'],
        strategies: {
          drop: 'Land on the highest building for loot advantage',
          rotation: 'Move towards center circle via water or land',
          endgame: 'Use high ground for final positioning'
        }
      },
      {
        id: '2',
        name: 'Tilted Towers',
        description: 'Urban combat zone with intense close-quarters battles',
        type: 'Named Location',
        image: '/api/placeholder?width=300&height=200&bgColor=9B59B6&text=Tilted+Towers',
        coordinates: { x: 50, y: 50 },
        rarity: 'Common',
        lootQuality: 'Very High',
        playerTraffic: 'Very High',
        rotation: 'Random',
        season: 'Chapter 6 Season 4',
        specialFeatures: ['Building mechanics', 'Multiple floors'],
        strategies: {
          drop: 'Land on outskirts and work your way in',
          rotation: 'Exit early to avoid third-party situations',
          endgame: 'Use building cover for final fights'
        }
      }
    ];

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch from Fortnite API, using mock data',
      data: {
        pois: mockPOIs,
        currentSeason: 'Chapter 6 Season 4',
        mapVersion: '1.0',
        lastUpdate: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  }
}
