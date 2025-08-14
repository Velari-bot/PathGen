'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';

export default function TestOsirionAPIPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [epicId, setEpicId] = useState('');
  const [userId, setUserId] = useState('');
  const { user } = useAuth();

  const handleEpicSignIn = async () => {
    if (!user) {
      setTestResults(['❌ Please sign in first to use Epic Games authentication']);
      return;
    }

    setIsLoading(true);
    setTestResults(['🔄 Redirecting to Epic Games OAuth...']);

    try {
      // Epic Games OAuth flow
      const epicClientId = process.env.NEXT_PUBLIC_EPIC_CLIENT_ID;
      const redirectUri = process.env.NEXT_PUBLIC_EPIC_REDIRECT_URI || 'http://localhost:3000/auth/callback';
      
      if (!epicClientId) {
        throw new Error('Epic OAuth not configured. Please set NEXT_PUBLIC_EPIC_CLIENT_ID in your environment variables.');
      }

      // Epic OAuth parameters
      const params = new URLSearchParams({
        client_id: epicClientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'basic_profile',
        state: user.uid, // Pass user ID for security
      });

      // Redirect to Epic OAuth
      const epicOAuthUrl = `https://www.epicgames.com/id/authorize?${params.toString()}`;
      window.location.href = epicOAuthUrl;

    } catch (error) {
      console.error('Epic OAuth error:', error);
      setTestResults([
        '❌ Epic OAuth Configuration Error',
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        '',
        'To set up Epic OAuth:',
        '1. Go to Epic Games Developer Portal',
        '2. Create a new application',
        '3. Set NEXT_PUBLIC_EPIC_CLIENT_ID in your .env.local',
        '4. Set EPIC_CLIENT_SECRET in your .env.local'
      ]);
      setIsLoading(false);
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
            `Account: ${data.account?.name || 'N/A'}`,
            `Platform: ${data.account?.platform || 'N/A'}`,
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

  const testReplayUpload = async () => {
    if (!userId.trim()) {
      setTestResults(['Please enter a user ID first']);
      return;
    }

    setIsLoading(true);
    setTestResults(['Testing Replay Upload API...']);

    try {
      // Create a dummy file for testing
      const dummyFile = new File(['dummy replay data'], 'test-replay.replay', { type: 'application/octet-stream' });
      
      const formData = new FormData();
      formData.append('matchId', 'test-match-123');
      formData.append('userId', userId.trim());
      formData.append('replay', dummyFile);

      const response = await fetch('/api/osirion/replay', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        if (data.success) {
          setTestResults([
            '✅ Replay Upload Test Successful!',
            `Upload ID: ${data.upload?.id || 'N/A'}`,
            `Status: ${data.upload?.status || 'N/A'}`,
            `Usage: ${data.usage?.current || 0}/${data.usage?.limit || '∞'} uploads`
          ]);
        } else if (data.blocked) {
          setTestResults([
            '⚠️ Replay Upload Blocked',
            `Message: ${data.message || 'Unknown error'}`,
            data.upgradeRequired ? 'Upgrade Required: Yes' : 'Upgrade Required: No',
            data.suggestion ? `Suggestion: ${data.suggestion}` : ''
          ]);
        } else {
          setTestResults([
            '❌ Replay Upload Failed',
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
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                onClick={testReplayUpload}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                Test Replay Upload
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
