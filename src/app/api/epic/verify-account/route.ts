import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const displayName = searchParams.get('displayName');

    if (!displayName) {
      return NextResponse.json(
        { error: 'Display name is required' },
        { status: 400 }
      );
    }

    // Use Fortnite Tracker API to verify the account exists
    const fortniteApiKey = process.env.FORTNITE_TRACKER_KEY;
    if (!fortniteApiKey) {
      return NextResponse.json(
        { error: 'Fortnite API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://fortniteapi.io/v1/stats/br/v2?name=${encodeURIComponent(displayName)}`,
      {
        headers: {
          'Authorization': fortniteApiKey
        }
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    const data = await response.json();
    
    // Extract account information
    const account = {
      id: data.account.id,
      displayName: data.account.name,
      platform: data.account.platform,
    };

    return NextResponse.json({ account });
  } catch (error: any) {
    console.error('Epic account verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Account verification failed' },
      { status: 500 }
    );
  }
}
