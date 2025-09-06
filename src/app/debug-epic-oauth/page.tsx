'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function DebugEpicOAuthPage() {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const runDebugCheck = () => {
    const info: string[] = [];
    
    // Check environment variables
    const epicClientId = process.env.NEXT_PUBLIC_EPIC_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_EPIC_REDIRECT_URI;
    
    info.push('=== EPIC OAUTH DEBUG INFO ===');
    info.push('');
    
    // Environment variables
    info.push('Environment Variables:');
    info.push(`NEXT_PUBLIC_EPIC_CLIENT_ID: ${epicClientId ? `${epicClientId.substring(0, 8)}...` : 'NOT SET'}`);
    info.push(`NEXT_PUBLIC_EPIC_REDIRECT_URI: ${redirectUri || 'NOT SET'}`);
    info.push('');
    
    // User info
    info.push('User Info:');
    info.push(`User ID: ${user?.uid || 'NOT SIGNED IN'}`);
    info.push('');
    
    // URL construction
    if (epicClientId && redirectUri) {
      const params = new URLSearchParams({
        client_id: epicClientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'basic_profile friends_list country presence',
        state: user?.uid || 'test-state',
        prompt: 'consent',
      });
      
      const epicOAuthUrl = `https://api.epicgames.dev/epic/oauth/v1/authorize?${params.toString()}`;
      
      info.push('Generated OAuth URL (Epic Games Services):');
      info.push(epicOAuthUrl);
      
      // Also test the old endpoint
      const oldEpicOAuthUrl = `https://www.epicgames.com/id/authorize?${params.toString()}`;
      info.push('');
      info.push('Alternative OAuth URL (Epic Games):');
      info.push(oldEpicOAuthUrl);
      info.push('');
      
      info.push('URL Components:');
      info.push(`Client ID: ${epicClientId}`);
      info.push(`Redirect URI: ${redirectUri}`);
      info.push(`State: ${user?.uid || 'test-state'}`);
      info.push('');
      
      info.push('Encoded Parameters:');
      info.push(params.toString());
      info.push('');
      
      // Test different redirect URI formats
      info.push('Testing Different Redirect URI Formats:');
      const testUris = [
        'https://pathgen.online/auth/callback',
        'https://pathgen.online/auth/callback/',
        'http://pathgen.online/auth/callback',
        'http://pathgen.online/auth/callback/',
      ];
      
      testUris.forEach((uri, index) => {
        const testParams = new URLSearchParams({
          client_id: epicClientId,
          redirect_uri: uri,
          response_type: 'code',
          scope: 'basic_profile friends_list country presence',
          state: user?.uid || 'test-state',
        });
        const testUrl = `https://www.epicgames.com/id/authorize?${testParams.toString()}`;
        info.push(`${index + 1}. ${uri}`);
        info.push(`   URL: ${testUrl}`);
      });
    }
    
    setDebugInfo(info);
  };

  const testEpicOAuth = () => {
    if (!user) {
      alert('Please sign in first');
      return;
    }

    const epicClientId = process.env.NEXT_PUBLIC_EPIC_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_EPIC_REDIRECT_URI || 'https://pathgen.online/auth/callback';
    
    if (!epicClientId) {
      alert('Epic Client ID not configured');
      return;
    }

    const params = new URLSearchParams({
      client_id: epicClientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'basic_profile friends_list country presence',
      state: user.uid,
      prompt: 'consent',
    });

    const epicOAuthUrl = `https://api.epicgames.dev/epic/oauth/v1/authorize?${params.toString()}`;
    
    console.log('Epic OAuth Debug:', {
      epicClientId,
      redirectUri,
      epicOAuthUrl,
      params: params.toString()
    });
    
    window.location.href = epicOAuthUrl;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Epic OAuth Debug Tool</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          <button
            onClick={runDebugCheck}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4"
          >
            Run Debug Check
          </button>
          
          {debugInfo.length > 0 && (
            <div className="bg-gray-100 p-4 rounded font-mono text-sm">
              {debugInfo.map((line, index) => (
                <div key={index}>{line}</div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Epic OAuth</h2>
          <p className="text-gray-600 mb-4">
            This will redirect you to Epic Games OAuth. Make sure you're signed in first.
          </p>
          <button
            onClick={testEpicOAuth}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Test Epic OAuth Flow
          </button>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Epic Developer Portal Checklist</h3>
          <ul className="text-yellow-700 space-y-1">
            <li>✓ Go to Epic Games Developer Portal</li>
            <li>✓ Navigate to your application</li>
            <li>✓ Check that Redirect URI is exactly: <code className="bg-yellow-100 px-1 rounded">https://pathgen.online/auth/callback</code></li>
            <li>✓ Verify Client ID matches: <code className="bg-yellow-100 px-1 rounded">xyza7891rE8y75fwQSAfSftmfcS17q6e</code></li>
            <li>✓ Ensure application is published/active</li>
            <li>✓ Check that OAuth is enabled for your application</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
