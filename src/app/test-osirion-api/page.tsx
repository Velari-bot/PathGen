'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { FirebaseService, EpicAccount, FortniteStats } from '@/lib/firebase-service';

export default function TestOsirionAPIPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [epicId, setEpicId] = useState('');
  const [userId, setUserId] = useState('');
  const { user } = useAuth();

  // Auto-populate Epic ID and User ID from localStorage when page loads
  useEffect(() => {
    // Check if this is an Epic OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');
    
    if (code && state) {
      console.log('Epic OAuth callback detected, processing...');
      handleEpicOAuthCallback(code, state);
      return;
    }
    
    if (error) {
      console.error('Epic OAuth error:', error);
      setTestResults([
        '❌ Epic OAuth Error',
        `Error: ${error}`,
        'Please try Epic OAuth again'
      ]);
      return;
    }
    
    // Load existing Epic account data from localStorage
    const epicAccountData = localStorage.getItem('epicAccountData');
    if (epicAccountData) {
      try {
        const parsed = JSON.parse(epicAccountData);
        setEpicId(parsed.epicId);
        setUserId(parsed.userId);
        
        const accountType = parsed.isReal ? '✅ REAL Epic Account' : '🔄 Development Account';
        const note = parsed.note ? `\nNote: ${parsed.note}` : '';
        
        setTestResults([
          `${accountType} loaded from localStorage`,
          `Epic ID: ${parsed.epicId}`,
          `Display Name: ${parsed.displayName}`,
          `Linked at: ${new Date(parsed.linkedAt).toLocaleString()}`,
          `Account Type: ${parsed.isReal ? 'Real Epic OAuth' : 'Development Fallback'}`,
          note,
          '',
          parsed.isReal ? '🎉 Real Epic account connected! Ready to test Osirion API!' : '⚠️ Using development account. Epic OAuth needs configuration.'
        ]);
        console.log('Loaded Epic account data:', parsed);
      } catch (error) {
        console.error('Failed to parse Epic account data:', error);
      }
    }
  }, []);

  const handleEpicOAuthCallback = async (code: string, state: string) => {
    if (!user || user.uid !== state) {
      setTestResults(['❌ Invalid user state for Epic OAuth']);
      return;
    }

    setIsLoading(true);
    setTestResults(['🔄 Processing Epic OAuth callback...']);

    try {
      const response = await fetch('/api/epic/oauth-callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          userId: user.uid,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to connect Epic account');
      }

      const data = await response.json();
      
      if (data.epicAccount) {
        localStorage.setItem('epicAccountData', JSON.stringify(data.epicAccount));
        console.log('Stored Epic account data:', data.epicAccount);
        
        setEpicId(data.epicAccount.epicId);
        setUserId(data.epicAccount.userId);
        
        setTestResults([
          '✅ Epic OAuth Successful!',
          `Epic ID: ${data.epicAccount.epicId}`,
          `Display Name: ${data.epicAccount.displayName}`,
          `Account Type: ${data.epicAccount.isReal ? 'Real Epic OAuth' : 'Development'}`,
          '',
          '🔄 Immediately pulling data from Osirion API...'
        ]);

        // Immediately pull data from Osirion API after successful OAuth
        await pullStatsFromOsirion(data.epicAccount);
      }
    } catch (error) {
      console.error('Epic OAuth callback error:', error);
      setTestResults([
        '❌ Epic OAuth Failed',
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Please try Epic OAuth again'
      ]);
    } finally {
      setIsLoading(false);
      // Clear the URL parameters
      window.history.replaceState({}, document.title, '/test-osirion-api');
    }
  };

  const handleEpicSignIn = async () => {
    if (!user) {
      setTestResults(['❌ Please sign in first to use Epic Games authentication']);
      return;
    }

    setIsLoading(true);
    setTestResults(['🔄 Checking Epic OAuth configuration...']);

    // Epic Games OAuth flow - define variables outside try-catch for scope
    const epicClientId = process.env.NEXT_PUBLIC_EPIC_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_EPIC_REDIRECT_URI || 'https://pathgen.online/auth/callback';

    try {
      
      console.log('Epic OAuth Debug:', {
        epicClientId,
        redirectUri,
        hasClientId: !!epicClientId,
        envRedirectUri: process.env.NEXT_PUBLIC_EPIC_REDIRECT_URI
      });
      
      if (!epicClientId) {
        throw new Error('Epic OAuth not configured. Please set NEXT_PUBLIC_EPIC_CLIENT_ID in your .env.local file.');
      }

      // Epic OAuth parameters - Epic uses a different OAuth flow
      const params = new URLSearchParams({
        client_id: epicClientId,
        redirect_uri: redirectUri, // Use environment variable
        response_type: 'code',
        scope: 'basic_profile friends_list country presence', // Request all required permissions
        state: user.uid, // Pass user ID for security
        prompt: 'consent', // Force Epic to show consent screen
      });

      // Epic Games OAuth endpoint
      const epicOAuthUrl = `https://www.epicgames.com/id/authorize?${params.toString()}`;
      console.log('Epic OAuth Debug:', {
        epicClientId,
        redirectUri,
        epicOAuthUrl,
        params: params.toString()
      });
      
      setTestResults([
        '🔄 Epic OAuth Configuration Found!',
        `Client ID: ${epicClientId.substring(0, 8)}...`,
        `Redirect URI: ${redirectUri}`,
        'Redirecting to Epic OAuth...',
        '',
        'IMPORTANT: Make sure to check ALL permission boxes on Epic\'s page!',
        'Required permissions: basic_profile, friends_list, country, presence'
      ]);
      
      // Redirect immediately to Epic OAuth
      window.location.href = epicOAuthUrl;

    } catch (error) {
      console.error('Epic OAuth error:', error);
      setTestResults([
        '❌ Epic OAuth Configuration Error',
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        '',
        'To set up Epic OAuth locally:',
        '1. Go to Epic Games Developer Portal',
        '2. Create a new application',
        '3. Set NEXT_PUBLIC_EPIC_CLIENT_ID in .env.local',
        '4. Set EPIC_CLIENT_SECRET in .env.local',
        `5. Add redirect URI: ${redirectUri}`,
        '',
        'Current environment check:',
        `NEXT_PUBLIC_EPIC_CLIENT_ID: ${process.env.NEXT_PUBLIC_EPIC_CLIENT_ID ? 'SET' : 'NOT SET'}`,
        `NEXT_PUBLIC_EPIC_REDIRECT_URI: ${process.env.NEXT_PUBLIC_EPIC_REDIRECT_URI || 'DEFAULT'}`
      ]);
      setIsLoading(false);
    }
  };

    const pullStatsFromOsirion = async (account: any) => {
    if (!account || !user) return;
    
    try {
      console.log('🔄 Immediately pulling stats from Osirion API after OAuth success...');
      
      // First, save the Epic account to Firebase with expanded fields
      const epicAccountData: EpicAccount = {
        id: FirebaseService.generateId(),
        epicId: account.epicId,
        displayName: account.displayName,
        platform: account.platform || 'Epic',
        userId: user.uid,
        linkedAt: new Date(),
        isReal: account.isReal || false,
        note: account.note,
        // Additional Epic account fields
        accountId: account.accountId,
        country: account.country,
        preferredLanguage: account.preferredLanguage,
        email: account.email,
        lastLogin: new Date(),
        status: 'active' as const,
        verificationStatus: 'verified' as const
      };
      
      await FirebaseService.saveEpicAccount(epicAccountData);
      console.log('✅ Epic account saved to Firebase');
      
      // Now pull stats from Osirion API
      const response = await fetch('/api/osirion/stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          epicId: account.epicId,
          userId: user.uid,
          platform: 'pc'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Create comprehensive Fortnite stats structure
          const fortniteStatsData: FortniteStats = {
            id: FirebaseService.generateId(),
            userId: user.uid,
            epicId: account.epicId,
            epicName: account.displayName,
            platform: 'pc',
            lastUpdated: new Date(),
            
            // Overall stats from Osirion API
            overall: {
              kd: data.stats?.all?.kd || 0,
              winRate: data.stats?.all?.winRate || 0,
              matches: data.stats?.all?.matches || 0,
              avgPlace: data.stats?.all?.avgPlace || 0,
              top1: data.stats?.all?.top1 || 0,
              top3: data.stats?.all?.top3 || 0,
              top5: data.stats?.all?.top5 || 0,
              top10: data.stats?.all?.top10 || 0,
              top25: data.stats?.all?.top25 || 0,
              kills: data.stats?.all?.kills || 0,
              deaths: data.stats?.all?.deaths || 0,
              assists: data.stats?.all?.assists || 0,
              damageDealt: data.stats?.all?.damageDealt || 0,
              damageTaken: data.stats?.all?.damageTaken || 0,
              timeAlive: data.stats?.all?.timeAlive || 0,
              distanceTraveled: data.stats?.all?.distanceTraveled || 0,
              materialsGathered: data.stats?.all?.materialsGathered || 0,
              structuresBuilt: data.stats?.all?.structuresBuilt || 0
            },
            
            // Usage tracking
            usage: {
              current: data.usage?.current || 0,
              limit: data.usage?.limit || 0,
              resetDate: data.usage?.resetDate ? new Date(data.usage.resetDate) : new Date(),
              lastApiCall: new Date(),
              totalApiCalls: 1
            },
            
            // Metadata
            metadata: {
              season: data.metadata?.season || 1,
              chapter: data.metadata?.chapter || 1,
              dataSource: 'osirion' as const,
              dataQuality: 'high' as const,
              notes: 'Data pulled from Osirion API after Epic OAuth'
            }
          };
          
          await FirebaseService.saveFortniteStats(fortniteStatsData);
          console.log('✅ Comprehensive Fortnite stats saved to Firebase');
          
          setTestResults([
            '✅ Epic OAuth Successful!',
            `Epic ID: ${account.epicId}`,
            `Display Name: ${account.displayName}`,
            `Account Type: ${account.isReal ? 'Real Epic OAuth' : 'Development'}`,
            '',
            '✅ Comprehensive Stats loaded from Osirion API and saved to Firebase!',
            `Account: ${data.account?.name || data.username || 'N/A'}`,
            `Platform: ${data.account?.platform || 'pc'}`,
            `K/D: ${data.stats?.all?.kd?.toFixed(2) || 'N/A'}`,
            `Win Rate: ${data.stats?.all?.winRate?.toFixed(1) || 'N/A'}%`,
            `Matches: ${data.stats?.all?.matches || 'N/A'}`,
            `Total Kills: ${data.stats?.all?.kills || 'N/A'}`,
            `Victories: ${data.stats?.all?.top1 || 'N/A'}`,
            `Usage: ${data.usage?.current || 0}/${data.usage?.limit || '∞'} matches`,
            '',
            'Ready to test other Osirion API endpoints!'
          ]);
          console.log('✅ Comprehensive stats loaded from Osirion API and saved to Firebase:', fortniteStatsData);
        } else {
          setTestResults([
            '✅ Epic OAuth Successful!',
            `Epic ID: ${account.epicId}`,
            `Display Name: ${account.displayName}`,
            `Account Type: ${account.isReal ? 'Real Epic OAuth' : 'Development'}`,
            '',
            '⚠️ Osirion API response not successful',
            `Error: ${data.error || 'Unknown error'}`,
            '',
            'Ready to test other Osirion API endpoints!'
          ]);
          console.log('⚠️ Osirion API response not successful:', data);
        }
      } else {
        setTestResults([
          '✅ Epic OAuth Successful!',
          `Epic ID: ${account.epicId}`,
          `Display Name: ${account.displayName}`,
          `Account Type: ${account.isReal ? 'Real Epic OAuth' : 'Development'}`,
          '',
          '❌ Failed to fetch stats from Osirion API',
          `Status: ${response.status}`,
          '',
          'Ready to test other Osirion API endpoints!'
        ]);
        console.error('❌ Failed to fetch stats from Osirion API:', response.status);
      }
    } catch (error) {
      setTestResults([
        '✅ Epic OAuth Successful!',
        '✅ Epic OAuth Successful!',
        `Epic ID: ${account.epicId}`,
        `Display Name: ${account.displayName}`,
        `Account Type: ${account.isReal ? 'Real Epic OAuth' : 'Development'}`,
        '',
        '❌ Error pulling stats from Osirion API',
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        '',
        'Ready to test other Osirion API endpoints!'
      ]);
      console.error('❌ Error pulling stats from Osirion API:', error);
    }
  };

  const testAPI = async () => {
    if (!epicId.trim() || !userId.trim()) {
      setTestResults(['Please enter both Epic ID and user ID first']);
      return;
    }

    setIsLoading(true);
    setTestResults(['Testing Osirion API...']);

    try {
      // Test the API route
      const response = await fetch('/api/osirion/stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          epicId: epicId.trim(),
          userId: userId.trim(),
          platform: 'pc'
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        if (data.success) {
          setTestResults([
            '✅ Osirion API Test Successful!',
            `Account: ${data.account?.name || data.username || 'N/A'}`,
            `Platform: ${data.account?.platform || 'pc'}`,
            `K/D: ${data.stats?.all?.kd?.toFixed(2) || 'N/A'}`,
            `Win Rate: ${data.stats?.all?.winRate?.toFixed(1) || 'N/A'}%`,
            `Matches: ${data.stats?.all?.matches || 'N/A'}`,
            `Usage: ${data.usage?.current || 0}/${data.usage?.limit || '∞'} matches`,
            `Reset Date: ${data.usage?.resetDate ? new Date(data.usage.resetDate).toLocaleDateString() : 'N/A'}`
          ]);
        } else if (data.blocked) {
          setTestResults([
            '⚠️ API Blocked/Unavailable',
            `Message: ${data.message || 'Unknown error'}`,
            data.upgradeRequired ? 'Upgrade Required: Yes' : 'Upgrade Required: No',
            data.suggestion ? `Suggestion: ${data.suggestion}` : '',
            'Fallback options available'
          ]);
        } else {
          setTestResults([
            '❌ API Test Failed',
            `Error: ${data.error || 'Unknown error'}`,
            data.details ? `Details: ${data.details}` : ''
          ]);
        }
      } else {
        setTestResults([
          '❌ HTTP Error',
          `Status: ${response.status}`,
          `Error: ${data.error || 'Unknown error'}`
        ]);
      }
    } catch (error) {
      setTestResults([
        '❌ Network Error',
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      ]);
    } finally {
      setIsLoading(false);
    }
  };


  const testComputeRequest = async () => {
    if (!userId.trim()) {
      setTestResults(['Please enter a user ID first']);
      return;
    }

    setIsLoading(true);
    setTestResults(['Testing Compute Request API...']);

    try {
      const response = await fetch('/api/osirion/compute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId.trim(),
          computeType: 'match_analysis',
          data: { matchId: 'test-match-123' }
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        if (data.success) {
          setTestResults([
            '✅ Compute Request Test Successful!',
            `Request ID: ${data.computeRequest?.id || 'N/A'}`,
            `Type: ${data.computeRequest?.type || 'N/A'}`,
            `Status: ${data.computeRequest?.status || 'N/A'}`,
            `Usage: ${data.usage?.current || 0}/${data.usage?.limit || '∞'} requests`
          ]);
        } else if (data.blocked) {
          setTestResults([
            '⚠️ Compute Request Blocked',
            `Message: ${data.message || 'Unknown error'}`,
            data.upgradeRequired ? 'Upgrade Required: Yes' : 'Upgrade Required: No',
            data.suggestion ? `Suggestion: ${data.suggestion}` : ''
          ]);
        } else {
          setTestResults([
            '❌ Compute Request Failed',
            `Error: ${data.error || 'Unknown error'}`
          ]);
        }
      } else {
        setTestResults([
          '❌ HTTP Error',
          `Status: ${response.status}`,
          `Error: ${data.error || 'Unknown error'}`
        ]);
      }
    } catch (error) {
      setTestResults([
        '❌ Network Error',
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white text-center mb-8">
            Test Osirion API
          </h1>
          
          <div className="glass-card p-6 mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">API Configuration</h2>
            
            {/* Epic Games Sign In */}
            <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-300 mb-3">Quick Setup with Epic Games</h3>
              <p className="text-sm text-gray-300 mb-4">
                Click the button below to automatically populate your Epic ID and User ID for testing.
              </p>
              <button
                onClick={handleEpicSignIn}
                disabled={isLoading || !user}
                className="w-full px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                                  {isLoading ? '🔄 Connecting...' : '🎮 Sign In with Epic Games'}
              </button>
              {!user && (
                <p className="text-xs text-red-400 mt-2 text-center">
                  Please sign in to your account first to use Epic Games authentication
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Epic ID (Epic Games)
                </label>
                <input
                  type="text"
                  value={epicId}
                  onChange={(e) => setEpicId(e.target.value)}
                  placeholder="Enter Epic ID (e.g., 37da09eb8b574968ad36da5adc02232b)"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                />
                <p className="text-xs text-gray-400 mt-1">
                  You can find your Epic ID in your Epic Games account settings
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  User ID (for testing)
                </label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter test user ID"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">API Tests</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <button
                onClick={testAPI}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Test Stats API
              </button>
              <button
                onClick={testComputeRequest}
                disabled={isLoading}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
              >
                Test Compute Request
              </button>
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Test Results</h2>
            <div className="bg-black/20 p-4 rounded-lg min-h-[200px]">
              {testResults.length === 0 ? (
                <p className="text-gray-400">Run a test to see results...</p>
              ) : (
                <div className="space-y-2">
                  {testResults.map((result, index) => (
                    <div key={index} className="text-sm font-mono text-white">
                      {result}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 text-center">
            <a
              href="/ai"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              ← Back to AI Coaching
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
