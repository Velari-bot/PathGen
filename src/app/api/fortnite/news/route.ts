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

    // Fetch news data from fortniteapi.io
    const response = await fetch(`${FORTNITE_API_BASE_URL}/news`, {
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
    const transformedNews = data.news?.map((item: any) => ({
      id: item.id || Math.random().toString(36).substr(2, 9),
      title: item.title || 'Untitled News',
      body: item.body || 'No content available',
      image: item.image || `/api/placeholder?width=400&height=200&bgColor=4A90E2&text=News`,
      date: item.date || new Date().toISOString().split('T')[0],
      type: item.type || 'br',
      url: item.url || '#',
      category: item.category || 'General',
      priority: item.priority || 'normal',
    })) || [];

    // Filter by type if specified
    const filteredNews = type === 'all'
      ? transformedNews
      : transformedNews.filter((item: any) => item.type === type);

    return NextResponse.json({
      success: true,
      data: filteredNews,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching Fortnite news data:', error);
    
    // Return mock data as fallback
    const mockNewsItems = [
      {
        id: '1',
        title: 'Chapter 6 Season 4: Last Resort',
        body: 'Dive into the mysterious depths of Chapter 6 Season 4: Last Resort. Explore underwater locations, discover new weapons, and battle it out in the most intense season yet!',
        image: '/api/placeholder?width=400&height=200&bgColor=4A90E2&text=Chapter+6+Season+4',
        date: '2024-01-15',
        type: 'br',
        url: '#'
      },
      {
        id: '2',
        title: 'Save the World: New Hero Classes',
        body: 'Introducing new hero classes in Save the World! Master the art of combat with these powerful new characters and abilities.',
        image: '/api/placeholder?width=400&height=200&bgColor=9B59B6&text=Save+The+World',
        date: '2024-01-14',
        type: 'stw',
        url: '#'
      },
      {
        id: '3',
        title: 'Creative 2.0: Advanced Building Tools',
        body: 'Unleash your creativity with the new advanced building tools in Creative 2.0. Create amazing experiences like never before!',
        image: '/api/placeholder?width=400&height=200&bgColor=3498DB&text=Creative+2.0',
        date: '2024-01-13',
        type: 'creative',
        url: '#'
      }
    ];

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch from Fortnite API, using mock data',
      data: mockNewsItems,
      timestamp: new Date().toISOString(),
    });
  }
}
