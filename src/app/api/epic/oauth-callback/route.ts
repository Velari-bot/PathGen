import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400 }
      );
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://api.epicgames.dev/epic/oauth/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.EPIC_CLIENT_ID}:${process.env.EPIC_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.EPIC_REDIRECT_URI || '',
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Epic token exchange failed:', await tokenResponse.text());
      throw new Error('Failed to exchange authorization code for access token');
    }

    const tokenData = await tokenResponse.json();
    const { access_token } = tokenData;

    // Get user info using the access token
    const userResponse = await fetch('https://api.epicgames.dev/epic/oauth/v1/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to get user info');
    }

    const userData = await userResponse.json();

    const account = {
      id: userData.sub,
      displayName: userData.preferred_username,
      email: userData.email,
    };

    return NextResponse.json({ 
      account,
      accessToken: access_token,
      refreshToken: tokenData.refresh_token 
    });
  } catch (error: any) {
    console.error('Epic OAuth callback error:', error);
    return NextResponse.json(
      { error: error.message || 'OAuth callback failed' },
      { status: 500 }
    );
  }
}
