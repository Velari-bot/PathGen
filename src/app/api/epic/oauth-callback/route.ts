import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code, userId } = await request.json();

    if (!code || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Epic OAuth configuration
    const clientId = process.env.EPIC_CLIENT_ID;
    const clientSecret = process.env.EPIC_CLIENT_SECRET;
    const redirectUri = process.env.EPIC_REDIRECT_URI || 'https://pathgen.online/auth/callback';

    console.log('Epic OAuth Debug:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      redirectUri,
      codeLength: code?.length,
      userId
    });

    if (!clientId || !clientSecret) {
      console.error('Missing Epic OAuth credentials');
      return NextResponse.json(
        { error: 'Epic OAuth not configured' },
        { status: 500 }
      );
    }

    // Try the correct Epic OAuth endpoint
    const tokenUrl = 'https://api.epicgames.com/oauth/token';
    
    console.log('Attempting token exchange with:', tokenUrl);

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    console.log('Token response status:', tokenResponse.status);
    console.log('Token response headers:', Object.fromEntries(tokenResponse.headers.entries()));

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Epic token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        errorData
      });
      return NextResponse.json(
        { error: `Failed to exchange authorization code: ${tokenResponse.status} ${tokenResponse.statusText}` },
        { status: 400 }
      );
    }

    const tokenData = await tokenResponse.json();
    console.log('Token exchange successful, got access token');
    
    const accessToken = tokenData.access_token;

    // Get Epic account information
    const accountResponse = await fetch('https://api.epicgames.com/epic/id/v1/accounts/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    console.log('Account info response status:', accountResponse.status);

    if (!accountResponse.ok) {
      const errorData = await accountResponse.text();
      console.error('Epic account info failed:', {
        status: accountResponse.status,
        statusText: accountResponse.statusText,
        errorData
      });
      return NextResponse.json(
        { error: 'Failed to get Epic account information' },
        { status: 400 }
      );
    }

    const accountData = await accountResponse.json();
    console.log('Got Epic account data:', accountData);

    // Store Epic account information in your database
    // This would typically go to Firebase or your preferred database
    const epicAccount = {
      epicId: accountData.accountId,
      displayName: accountData.displayName,
      linkedAt: new Date().toISOString(),
      userId: userId,
    };

    // TODO: Save epicAccount to your database
    console.log('Epic account linked:', epicAccount);

    return NextResponse.json({
      success: true,
      epicAccount: epicAccount,
      message: 'Epic account connected successfully',
    });

  } catch (error) {
    console.error('Epic OAuth callback error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
