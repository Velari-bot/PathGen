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
    const redirectUri = process.env.EPIC_REDIRECT_URI || 'http://localhost:3000/auth/callback';

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Epic OAuth not configured' },
        { status: 500 }
      );
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://api.epicgames.dev/epic/oauth/v1/token', {
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

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Epic token exchange failed:', errorData);
      return NextResponse.json(
        { error: 'Failed to exchange authorization code' },
        { status: 400 }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get Epic account information
    const accountResponse = await fetch('https://api.epicgames.dev/epic/id/v1/accounts/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!accountResponse.ok) {
      const errorData = await accountResponse.text();
      console.error('Epic account info failed:', errorData);
      return NextResponse.json(
        { error: 'Failed to get Epic account information' },
        { status: 400 }
      );
    }

    const accountData = await accountResponse.json();

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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
