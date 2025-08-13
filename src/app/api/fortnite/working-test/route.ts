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

    console.log('Testing Fortnite Tracker API...');
    console.log('API Key (first 8 chars):', apiKey.substring(0, 8) + '...');

    // Test with a known Fortnite player
    const testUsername = 'Ninja';
    const platform = 'pc';
    
    console.log(`Testing endpoint: https://fortnitetracker.com/api/v1/profile/${platform}/${testUsername}`);
    
    try {
      const response = await fetch(`https://fortnitetracker.com/api/v1/profile/${platform}/${testUsername}`, {
        headers: {
          'TRN-Api-Key': apiKey,
          'User-Agent': 'PathGen-AI/1.0 (Fortnite Stats Integration)',
          'Accept': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const result = {
        endpoint: `https://fortnitetracker.com/api/v1/profile/${platform}/${testUsername}`,
        status: response.status,
        ok: response.ok,
        success: false,
        data: null,
        error: null,
        headers: Object.fromEntries(response.headers.entries())
      };

      if (response.ok) {
        try {
          const data = await response.json();
          result.success = true;
          result.data = {
            hasData: !!data,
            dataKeys: Object.keys(data || {}),
            sampleData: data ? JSON.stringify(data).substring(0, 500) + '...' : 'No data'
          };
          console.log('✅ SUCCESS - Data received:', result.data);
        } catch (parseError) {
          result.error = 'Failed to parse JSON: ' + parseError.message;
          console.log('❌ FAILED - Parse error:', result.error);
        }
      } else {
        try {
          const errorText = await response.text();
          result.error = errorText.substring(0, 300);
          console.log('❌ FAILED - HTTP error:', result.error);
          
          // Check for specific error types
          if (errorText.includes('Just a moment') || errorText.includes('Cloudflare')) {
            result.error = 'Cloudflare protection detected - API is blocking requests';
          }
        } catch (textError) {
          result.error = 'Failed to read error text: ' + textError.message;
          console.log('❌ FAILED - Text error:', result.error);
        }
      }

      return NextResponse.json({
        message: 'Fortnite Tracker API test completed',
        apiKeyConfigured: true,
        apiKeyPreview: apiKey.substring(0, 8) + '...',
        testUsername,
        platform,
        result
      });

    } catch (fetchError) {
      console.error('❌ Fetch error:', fetchError);
      return NextResponse.json({
        message: 'Fortnite Tracker API test failed',
        apiKeyConfigured: true,
        apiKeyPreview: apiKey.substring(0, 8) + '...',
        testUsername,
        platform,
        error: fetchError.message,
        result: {
          endpoint: `https://fortnitetracker.com/api/v1/profile/${platform}/${testUsername}`,
          status: 'FETCH_ERROR',
          ok: false,
          success: false,
          data: null,
          error: fetchError.message
        }
      });
    }

  } catch (error) {
    console.error('❌ Error in working test:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message,
      message: 'Check server logs for details'
    }, { status: 500 });
  }
}
