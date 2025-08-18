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
    const section = searchParams.get('section') || 'featured';

    // Fetch shop data from fortniteapi.io
    const response = await fetch(`${FORTNITE_API_BASE_URL}/shop/br`, {
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
    const transformedItems = data.shop?.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description || 'No description available',
      type: item.type?.displayValue || 'Unknown',
      rarity: item.rarity?.displayValue || 'Common',
      images: {
        icon: item.images?.icon || `/api/placeholder?width=150&height=150&bgColor=666666&text=${encodeURIComponent(item.name)}`,
        featured: item.images?.featured || `/api/placeholder?width=300&height=300&bgColor=666666&text=${encodeURIComponent(item.name)}+Featured`,
      },
      price: item.price || 0,
      currency: item.priceIcon || 'V-Bucks',
      section: section,
      releaseDate: item.releaseDate,
      lastUpdate: item.lastUpdate,
    })) || [];

    return NextResponse.json({
      success: true,
      data: transformedItems,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching Fortnite shop data:', error);
    
    // Return mock data as fallback
    const mockShopItems = [
      {
        id: '1',
        name: 'Galaxy Skin',
        description: 'A legendary skin from the Galaxy set',
        type: 'Outfit',
        rarity: 'Legendary',
        images: {
          icon: '/api/placeholder?width=150&height=150&bgColor=4A90E2&text=Galaxy',
          featured: '/api/placeholder?width=300&height=300&bgColor=4A90E2&text=Galaxy+Featured'
        },
        price: 2000,
        currency: 'V-Bucks',
        section: 'featured'
      },
      {
        id: '2',
        name: 'Dragon Axe',
        description: 'Epic harvesting tool with fire effects',
        type: 'Harvesting Tool',
        rarity: 'Epic',
        images: {
          icon: '/api/placeholder?width=150&height=150&bgColor=9B59B6&text=Dragon'
        },
        price: 1500,
        currency: 'V-Bucks',
        section: 'featured'
      }
    ];

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch from Fortnite API, using mock data',
      data: mockShopItems,
      timestamp: new Date().toISOString(),
    });
  }
}
