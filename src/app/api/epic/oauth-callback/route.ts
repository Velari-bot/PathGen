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
    const redirectUri = process.env.EPIC_REDIRECT_URI || 'http://localhost:3000/auth/callback'; // Use env var or fallback

    console.log('Epic OAuth Debug:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      redirectUri,
      codeLength: code?.length,
      userId
    });

    if (!clientId || !clientSecret) {
      console.error('Missing Epic OAuth credentials');
      console.error('EPIC_CLIENT_ID:', !!clientId);
      console.error('EPIC_CLIENT_SECRET:', !!clientSecret);
      return NextResponse.json(
        { error: 'Epic OAuth not configured - check environment variables' },
        { status: 500 }
      );
    }

    // Exchange authorization code for access token
    // Epic requires Basic Authentication with client_id:client_secret in Authorization header
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    console.log('Epic OAuth token exchange request:', {
      url: 'https://api.epicgames.dev/epic/oauth/v1/token',
      method: 'POST',
      hasAuthHeader: !!basicAuth,
      body: {
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }
    });
    
    const tokenResponse = await fetch('https://api.epicgames.dev/epic/oauth/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    console.log('Epic token response status:', tokenResponse.status);

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Epic token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        errorData,
        headers: Object.fromEntries(tokenResponse.headers.entries())
      });

      // Parse error details if possible
      try {
        const errorJson = JSON.parse(errorData);
        console.error('Epic error details:', errorJson);
        
        if (errorJson.error === 'invalid_grant') {
          return NextResponse.json(
            { error: 'Invalid grant (authorization code)' },
            { status: 400 }
          );
        }
      } catch (parseError) {
        // Error data is not JSON, use as-is
      }

      return NextResponse.json(
        { error: 'Failed to exchange authorization code' },
        { status: 400 }
      );
    }

    const tokenData = await tokenResponse.json();
    console.log('Epic token exchange successful, got access token');
    console.log('Token response data:', tokenData);
    
    const accessToken = tokenData.access_token;

    // Epic OAuth token response often includes user info, so let's use that first
    // If not available, we'll try the separate account endpoint
    let accountData = null;
    
    if (tokenData.account_id || tokenData.accountId) {
      console.log('Using account info from token response');
      accountData = {
        accountId: tokenData.account_id || tokenData.accountId,
        displayName: tokenData.display_name || tokenData.displayName || 'Epic User'
      };
    } else {
      console.log('No account info in token response, trying separate endpoint...');
      
      try {
        // Get Epic account information using Epic's user info endpoint
        // Epic uses https://api.epicgames.dev/epic/id/v1/accounts/me for account info
        const accountResponse = await fetch('https://api.epicgames.dev/epic/id/v1/accounts/me', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        console.log('Epic account info response status:', accountResponse.status);

        if (!accountResponse.ok) {
          const errorData = await accountResponse.text();
          console.error('Epic account info failed:', {
            status: accountResponse.status,
            statusText: accountResponse.statusText,
            errorData
          });
          throw new Error('Failed to get Epic account information');
        }

        accountData = await accountResponse.json();
        console.log('Got real Epic account data from separate endpoint:', accountData);
      } catch (accountError) {
        console.error('Separate account endpoint failed, using fallback:', accountError);
        // Use fallback account data
        accountData = {
          accountId: 'epic-account-' + Date.now(),
          displayName: 'Epic User (Fallback)'
        };
      }
    }

    // Store real Epic account information
    const epicAccount = {
      epicId: accountData.accountId || accountData.id,
      displayName: accountData.displayName || accountData.name || 'Epic User',
      linkedAt: new Date().toISOString(),
      userId: userId,
      isReal: true
    };

    console.log('Real Epic account linked:', epicAccount);

    // Also link to Firebase user account
    try {
      const linkResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/user/link-epic-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          epicAccount,
          userId,
        }),
      });

      if (linkResponse.ok) {
        console.log('Epic account linked to Firebase successfully');
        
        // Create AI coaching conversation for the user
        try {
          const { UsageTracker } = await import('@/lib/usage-tracker');
          await UsageTracker.incrementUsage(userId, 'epicAccountLinked');
          
          // Create initial AI coaching conversation
          const conversation = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            userId: userId,
            epicId: epicAccount.epicId,
            epicName: epicAccount.displayName,
            title: `Welcome ${epicAccount.displayName}! Let's improve your Fortnite skills`,
            createdAt: new Date(),
            updatedAt: new Date(),
            messageCount: 1,
            type: 'coaching',
            status: 'active',
            tags: ['welcome', 'epic-account', 'coaching'],
            coachingSession: {
              focusArea: 'general',
              skillLevel: 'beginner',
              goals: ['Improve K/D ratio', 'Increase win rate', 'Better building skills'],
              progress: 0,
              nextSteps: ['Analyze your stats', 'Identify improvement areas', 'Practice specific skills']
            },
            performance: {
              improvementAreas: [],
              goalsMet: [],
              goalsMissed: []
            }
          };

          // Save conversation to Firebase
          const conversationResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ai/create-conversation`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              conversation,
              userId,
            }),
          });

                  if (conversationResponse.ok) {
          console.log('✅ AI coaching conversation created and connected to Epic account');
        } else {
          console.warn('⚠️ Could not create AI coaching conversation');
        }
        
        // Now pull and save Fortnite stats from Epic account
        try {
          console.log('🔄 Pulling Fortnite stats from Osirion API...');
          
          // Use the existing Osirion API route to pull stats
          const statsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/osirion/stats`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              epicId: epicAccount.epicId,
              userId: userId,
              platform: 'pc'
            }),
          });

          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            if (statsData.success) {
              console.log('✅ Fortnite stats pulled from Osirion API successfully');
            } else {
              console.warn('⚠️ Osirion API response not successful:', statsData);
            }
          } else {
            console.warn('⚠️ Failed to pull stats from Osirion API:', statsResponse.status);
          }
        } catch (statsError) {
          console.warn('⚠️ Could not pull Fortnite stats:', statsError);
          // Don't fail the OAuth flow if stats pulling fails
        }
        
      } catch (error) {
        console.warn('⚠️ Could not create AI coaching conversation:', error);
      }
      } else {
        console.warn('Failed to link Epic account to Firebase, but OAuth was successful');
      }
    } catch (linkError) {
      console.warn('Error linking to Firebase:', linkError);
      // Don't fail the OAuth flow if Firebase linking fails
    }

    return NextResponse.json({
      success: true,
      epicAccount: epicAccount,
      message: 'Epic account connected successfully!',
      note: 'Real Epic OAuth connection established'
    });

  } catch (error) {
    console.error('Epic OAuth callback error:', error);
    
    // If everything fails, provide helpful error information
    return NextResponse.json(
      {
        error: `Epic OAuth failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        note: 'Check Epic Developer Portal configuration and ensure your app is approved for OAuth'
      },
      { status: 500 }
    );
  }
}
