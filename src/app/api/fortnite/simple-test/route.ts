import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.FORTNITE_TRACKER_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'Fortnite Tracker API key not configured',
        message: 'Check your .env.local file for FORTNITE_TRACKER_KEY'
      }, { status: 500 });
    }

    console.log('Simple Fortnite Tracker API test...');
    console.log('API Key (first 8 chars):', apiKey.substring(0, 8) + '...');

    // Try the most basic endpoint first
    const testUsername = 'Ninja'; // Known Fortnite player
    
    try {
      // Test 1: Direct Fortnite Tracker API
      console.log('Test 1: Testing direct API endpoint...');
      const response1 = await fetch(`https://fortnitetracker.com/api/v1/profile/pc/${testUsername}`, {
        headers: {
          'TRN-Api-Key': apiKey
        }
      });
      
      console.log('Response 1 status:', response1.status);
      console.log('Response 1 headers:', Object.fromEntries(response1.headers.entries()));
      
      let result1 = {
        endpoint: 'https://fortnitetracker.com/api/v1/profile/pc/',
        status: response1.status,
        ok: response1.ok,
        success: false,
        data: null,
        error: null
      };

      if (response1.ok) {
        try {
          const data = await response1.json();
          result1.success = true;
          result1.data = {
            hasData: !!data,
            dataKeys: Object.keys(data || {}),
            sampleData: data ? JSON.stringify(data).substring(0, 300) + '...' : 'No data'
          };
          console.log('Test 1 SUCCESS - Data received:', result1.data);
        } catch (parseError) {
          result1.error = 'Failed to parse JSON: ' + parseError.message;
          console.log('Test 1 FAILED - Parse error:', result1.error);
        }
      } else {
        try {
          const errorText = await response1.text();
          result1.error = errorText.substring(0, 200);
          console.log('Test 1 FAILED - HTTP error:', result1.error);
        } catch (textError) {
          result1.error = 'Failed to read error text: ' + textError.message;
          console.log('Test 1 FAILED - Text error:', result1.error);
        }
      }

      return NextResponse.json({
        message: 'Fortnite Tracker API simple test completed',
        apiKeyConfigured: true,
        apiKeyPreview: apiKey.substring(0, 8) + '...',
        testUsername,
        results: [result1]
      });

    } catch (fetchError) {
      console.error('Fetch error in test 1:', fetchError);
      return NextResponse.json({
        message: 'Fortnite Tracker API test failed',
        apiKeyConfigured: true,
        apiKeyPreview: apiKey.substring(0, 8) + '...',
        testUsername,
        error: fetchError.message,
        results: [{
          endpoint: 'https://fortnitetracker.com/api/v1/profile/pc/',
          status: 'FETCH_ERROR',
          ok: false,
          success: false,
          data: null,
          error: fetchError.message
        }]
      });
    }

  } catch (error) {
    console.error('Error in simple Fortnite API test:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message,
      message: 'Check server logs for details'
    }, { status: 500 });
  }
}
