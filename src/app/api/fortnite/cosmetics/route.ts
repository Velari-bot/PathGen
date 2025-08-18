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
    const type = searchParams.get('type') || 'all';
    const rarity = searchParams.get('rarity') || 'all';
    const search = searchParams.get('search') || '';

    // Fetch cosmetics data from fortniteapi.io
    const response = await fetch(`${FORTNITE_API_BASE_URL}/cosmetics/br`, {
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
    let transformedCosmetics = data.cosmetics?.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description || 'No description available',
      type: item.type?.displayValue || 'Unknown',
      rarity: item.rarity?.displayValue || 'Common',
      images: {
        icon: item.images?.icon || `/api/placeholder?width=150&height=150&bgColor=666666&text=${encodeURIComponent(item.name)}`,
        featured: item.images?.featured || `/api/placeholder?width=300&height=300&bgColor=666666&text=${encodeURIComponent(item.name)}+Featured`,
        smallIcon: item.images?.smallIcon || `/api/placeholder?width=50&height=50&bgColor=666666&text=${encodeURIComponent(item.name.charAt(0))}`,
      },
      releaseDate: item.releaseDate,
      lastUpdate: item.lastUpdate,
      obtained: item.obtained || false,
      season: item.season || 'Unknown',
      battlePass: item.battlePass || false,
    })) || [];

    // Apply filters
    if (type !== 'all') {
      transformedCosmetics = transformedCosmetics.filter((item: any) => item.type === type);
    }
    
    if (rarity !== 'all') {
      transformedCosmetics = transformedCosmetics.filter((item: any) => item.rarity === rarity);
    }
    
    if (search) {
      transformedCosmetics = transformedCosmetics.filter((item: any) => 
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    return NextResponse.json({
      success: true,
      data: transformedCosmetics,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching Fortnite cosmetics data:', error);
    
    // Return mock data as fallback
    const mockCosmeticsItems = [
      {
        id: '1',
        name: 'Galaxy Skin',
        description: 'A legendary skin from the Galaxy set',
        type: 'Outfit',
        rarity: 'Legendary',
        images: {
          icon: '/api/placeholder?width=150&height=150&bgColor=4A90E2&text=Galaxy',
          featured: '/api/placeholder?width=300&height=300&bgColor=4A90E2&text=Galaxy+Featured',
          smallIcon: '/api/placeholder?width=50&height=50&bgColor=4A90E2&text=G'
        },
        releaseDate: '2024-01-15',
        lastUpdate: '2024-01-15',
        obtained: false,
        season: 'Chapter 6 Season 4',
        battlePass: false
      },
      {
        id: '2',
        name: 'Dragon Axe',
        description: 'Epic harvesting tool with fire effects',
        type: 'Harvesting Tool',
        rarity: 'Epic',
        images: {
          icon: '/api/placeholder?width=150&height=150&bgColor=9B59B6&text=Dragon',
          smallIcon: '/api/placeholder?width=50&height=50&bgColor=9B59B6&text=D'
        },
        releaseDate: '2024-01-14',
        lastUpdate: '2024-01-14',
        obtained: true,
        season: 'Chapter 6 Season 4',
        battlePass: true
      }
    ];

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch from Fortnite API, using mock data',
      data: mockCosmeticsItems,
      timestamp: new Date().toISOString(),
    });
  }
}
