'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function EpicOAuthTestPage() {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const runComprehensiveTest = async () => {
    setIsLoading(true);
    const results: string[] = [];
    
    results.push('=== EPIC OAUTH COMPREHENSIVE TEST ===');
    results.push('');
    
    // Environment check
    const epicClientId = process.env.NEXT_PUBLIC_EPIC_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_EPIC_REDIRECT_URI;
    
    results.push('1. ENVIRONMENT VARIABLES:');
    results.push(`   NEXT_PUBLIC_EPIC_CLIENT_ID: ${epicClientId ? `${epicClientId.substring(0, 8)}...` : 'NOT SET'}`);
    results.push(`   NEXT_PUBLIC_EPIC_REDIRECT_URI: ${redirectUri || 'NOT SET'}`);
    results.push('');
    
    // User check
    results.push('2. USER AUTHENTICATION:');
    results.push(`   User ID: ${user?.uid || 'NOT SIGNED IN'}`);
    results.push(`   User Email: ${user?.email || 'NOT AVAILABLE'}`);
    results.push('');
    
    // URL construction test
    if (epicClientId && redirectUri) {
      results.push('3. OAUTH URL CONSTRUCTION:');
      
      const params = new URLSearchParams({
        client_id: epicClientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'basic_profile friends_list country presence',
        state: user?.uid || 'test-state',
        prompt: 'consent',
      });
      
      const epicOAuthUrl = `https://www.epicgames.com/id/authorize?${params.toString()}`;
      
      results.push(`   Client ID: ${epicClientId}`);
      results.push(`   Redirect URI: ${redirectUri}`);
      results.push(`   State: ${user?.uid || 'test-state'}`);
      results.push(`   Full URL: ${epicOAuthUrl}`);
      results.push('');
      
      // Test different redirect URI formats
      results.push('4. REDIRECT URI FORMAT TESTS:');
      const testUris = [
        'https://pathgen.online/auth/callback',
        'https://pathgen.online/auth/callback/',
        'http://pathgen.online/auth/callback',
        'http://pathgen.online/auth/callback/',
        'https://www.pathgen.online/auth/callback',
        'https://www.pathgen.online/auth/callback/',
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
        results.push(`   ${index + 1}. ${uri}`);
        results.push(`      URL: ${testUrl}`);
      });
      results.push('');
      
      // Epic Developer Portal checklist
      results.push('5. EPIC DEVELOPER PORTAL CHECKLIST:');
      results.push('   Go to: https://dev.epicgames.com/');
      results.push('   Navigate to your application');
      results.push('   Check these settings:');
      results.push(`   ✓ Client ID: ${epicClientId}`);
      results.push(`   ✓ Redirect URI: ${redirectUri}`);
      results.push('   ✓ Application Status: Published/Active');
      results.push('   ✓ OAuth: Enabled');
      results.push('   ✓ Permissions: basic_profile, friends_list, country, presence');
      results.push('');
      
      // Common issues
      results.push('6. COMMON ISSUES TO CHECK:');
      results.push('   ❌ Redirect URI has trailing slash');
      results.push('   ❌ Using HTTP instead of HTTPS');
      results.push('   ❌ Application not published in Epic portal');
      results.push('   ❌ OAuth not enabled in Epic portal');
      results.push('   ❌ Wrong client ID in Epic portal');
      results.push('   ❌ Browser cache (try incognito mode)');
      results.push('   ❌ Vercel cache (try redeploying)');
      results.push('');
      
      // Test instructions
      results.push('7. TESTING INSTRUCTIONS:');
      results.push('   1. Open browser in incognito/private mode');
      results.push('   2. Go to your Vercel deployment URL');
      results.push('   3. Sign in to your account');
      results.push('   4. Try Epic OAuth connection');
      results.push('   5. Check browser console for debug logs');
      results.push('   6. If still failing, check Epic Developer Portal');
    } else {
      results.push('❌ MISSING ENVIRONMENT VARIABLES');
      results.push('Please set NEXT_PUBLIC_EPIC_CLIENT_ID and NEXT_PUBLIC_EPIC_REDIRECT_URI');
    }
    
    setTestResults(results);
    setIsLoading(false);
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

    const epicOAuthUrl = `https://www.epicgames.com/id/authorize?${params.toString()}`;
    
    console.log('Epic OAuth Test (v2.0):', {
      epicClientId,
      redirectUri,
      epicOAuthUrl,
      params: params.toString(),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });
    
    // Add cache busting
    const cacheBustedUrl = `${epicOAuthUrl}&_cb=${Date.now()}`;
    window.location.href = cacheBustedUrl;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Epic OAuth Comprehensive Test</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Test Controls */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
            
            <div className="space-y-4">
              <button
                onClick={runComprehensiveTest}
                disabled={isLoading}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {isLoading ? 'Running Test...' : 'Run Comprehensive Test'}
              </button>
              
              <button
                onClick={testEpicOAuth}
                className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Test Epic OAuth Flow
              </button>
              
              <button
                onClick={() => {
                  console.clear();
                  console.log('Console cleared. Ready for new tests.');
                }}
                className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Clear Console
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            
            {testResults.length > 0 && (
              <div className="bg-gray-100 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
                {testResults.map((line, index) => (
                  <div key={index} className={line.startsWith('❌') ? 'text-red-600' : line.startsWith('✓') ? 'text-green-600' : ''}>
                    {line}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Fix Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Quick Fix Instructions</h3>
          <div className="text-yellow-700 space-y-2">
            <p><strong>1. Clear Browser Cache:</strong> Press Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)</p>
            <p><strong>2. Try Incognito Mode:</strong> Open a new incognito/private window</p>
            <p><strong>3. Check Epic Developer Portal:</strong> Go to https://dev.epicgames.com/ and verify your app settings</p>
            <p><strong>4. Redeploy to Vercel:</strong> Push changes to GitHub to trigger a new Vercel deployment</p>
            <p><strong>5. Check Console:</strong> Open browser dev tools and look for "Epic OAuth Test (v2.0)" logs</p>
          </div>
        </div>
      </div>
    </div>
  );
}
