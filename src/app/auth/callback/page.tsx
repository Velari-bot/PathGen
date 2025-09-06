'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        console.log('Epic OAuth Callback Debug:', {
          code: code ? `${code.substring(0, 8)}...` : null,
          state: state ? `${state.substring(0, 8)}...` : null,
          error,
          errorDescription,
          hasCode: !!code,
          hasState: !!state,
          hasError: !!error,
          url: window.location.href
        });

        if (error) {
          console.error('Epic OAuth error received:', { error, errorDescription });
          throw new Error(`OAuth error: ${error}${errorDescription ? ` - ${errorDescription}` : ''}`);
        }

        if (!code || !state) {
          console.error('Missing OAuth parameters:', { code: !!code, state: !!state });
          throw new Error('Missing OAuth parameters');
        }

        if (!user || user.uid !== state) {
          console.error('Invalid user state:', { userUid: user?.uid, stateUid: state });
          throw new Error('Invalid user state');
        }

        setMessage('Connecting your Epic account...');

        // Exchange code for access token and get user info
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
          
          // Check if it's a scope consent error
          if (errorData.requiresConsent) {
            setStatus('error');
            setMessage('Epic OAuth requires additional permissions');
            setTestResults([
              '⚠️ Epic OAuth Scope Consent Required',
              '',
              'Epic Games requires you to approve the requested permissions:',
              '• basic_profile - Access to your basic profile information',
              '• openid - OpenID Connect authentication',
              '',
              'To fix this:',
              '1. Go back to Epic OAuth',
              '2. Make sure to check all permission boxes',
              '3. Complete the authorization process',
              '',
              'Click "Try Epic OAuth Again" to retry'
            ]);
            return;
          }
          
          throw new Error(errorData.error || 'Failed to connect Epic account');
        }

        const data = await response.json();
        
                // Store Epic account data in localStorage for the dashboard to use
        if (data.epicAccount) {
          localStorage.setItem('epicAccountData', JSON.stringify(data.epicAccount));
          console.log('Stored Epic account data:', data.epicAccount);
        }
        
        setStatus('success');
        setMessage('Epic account connected successfully!');
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);

      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Failed to connect Epic account');
      }
    };

    if (user) {
      handleCallback();
    }
  }, [user, searchParams, router]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-dark">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Authentication Required</h1>
            <p className="text-gray-300">Please sign in to continue.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />
      <div className="flex items-center justify-center min-h-screen">
        <div className="glass-card p-8 text-center max-w-md">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
              <h1 className="text-2xl font-bold text-white mb-4">Connecting Epic Account</h1>
              <p className="text-gray-300">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-4">Success!</h1>
              <p className="text-gray-300">{message}</p>
              <p className="text-sm text-gray-400 mt-2">Redirecting to dashboard...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-4">Connection Failed</h1>
              <p className="text-red-300 mb-4">{message}</p>
              
              {testResults.length > 0 && (
                <div className="bg-black/20 p-4 rounded-lg mb-4 text-left">
                  {testResults.map((result, index) => (
                    <div key={index} className="text-sm text-gray-300 mb-1">
                      {result}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-2 bg-white text-dark-charcoal rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Go to Dashboard
                </button>
                
                {testResults.length > 0 && (
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Try Epic OAuth Again
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-dark">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-white mb-4">Loading...</h1>
          </div>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
