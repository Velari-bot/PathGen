import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.FORTNITE_TRACKER_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Fortnite Tracker API key not configured' }, { status: 500 });
    }

    console.log('Testing Fortnite Tracker API connection...');
    console.log('Using API key:', apiKey.substring(0, 8) + '...');

    // Test different endpoints
    const endpoints = [
      'https://fortnitetracker.com/api/v1/profile/pc/Ninja',
      'https://api.fortnitetracker.com/v1/profile/pc/Ninja',
      'https://fortnitetracker.com/api/v1/profile/pc/Tfue'
    ];

    const results = [];

    for (const endpoint of endpoints) {
      try {
        console.log(`Testing endpoint: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          headers: {
            'TRN-Api-Key': apiKey
          }
        });

        const result = {
          endpoint,
          status: response.status,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        };

        if (response.ok) {
          try {
            const data = await response.json();
            result.data = {
              hasData: !!data,
              dataKeys: Object.keys(data || {}),
              sampleData: data ? JSON.stringify(data).substring(0, 200) + '...' : 'No data'
            };
          } catch (parseError) {
            result.parseError = 'Failed to parse JSON response';
          }
        } else {
          try {
            const errorText = await response.text();
            result.error = errorText.substring(0, 200);
          } catch (textError) {
            result.error = 'Failed to read error text';
          }
        }

        results.push(result);
        console.log(`Endpoint ${endpoint} result:`, result);

      } catch (error) {
        console.error(`Error testing endpoint ${endpoint}:`, error);
        results.push({
          endpoint,
          error: error.message,
          status: 'FETCH_ERROR'
        });
      }
    }

    return NextResponse.json({
      message: 'Fortnite Tracker API test completed',
      apiKeyConfigured: !!apiKey,
      apiKeyPreview: apiKey.substring(0, 8) + '...',
      results
    });

  } catch (error) {
    console.error('Error in Fortnite API test:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
