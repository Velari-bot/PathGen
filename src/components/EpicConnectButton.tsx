'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface EpicConnectButtonProps {
  onAccountLinked: (account: any) => void;
  onError: (error: string) => void;
}

export function EpicConnectButton({ onAccountLinked, onError }: EpicConnectButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleEpicConnect = async () => {
    console.log('EpicConnectButton clicked!');
    
    if (!user) {
      console.log('No user found, showing error');
      onError('Please sign in to your account first');
      return;
    }

    console.log('User found:', user.uid);
    setIsLoading(true);

    try {
      // Epic Games OAuth flow
      const epicClientId = process.env.NEXT_PUBLIC_EPIC_CLIENT_ID;
      const redirectUri = process.env.NEXT_PUBLIC_EPIC_REDIRECT_URI || 'https://pathgen.online/auth/callback';
      
      console.log('Epic OAuth config:', {
        hasClientId: !!epicClientId,
        clientId: epicClientId ? `${epicClientId.substring(0, 8)}...` : 'missing',
        redirectUri
      });
      
      if (!epicClientId) {
        throw new Error('Epic OAuth not configured. Please set NEXT_PUBLIC_EPIC_CLIENT_ID in your environment variables.');
      }

      // Epic OAuth parameters - Epic Games requires specific format
      const params = new URLSearchParams({
        client_id: epicClientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'basic_profile friends_list country presence',
        state: user.uid, // Pass user ID for security
        prompt: 'consent', // Force consent screen
      });

      // Epic Games OAuth endpoint
      const epicOAuthUrl = `https://www.epicgames.com/id/authorize?${params.toString()}`;
      console.log('Epic OAuth Debug:', {
        epicClientId,
        redirectUri,
        epicOAuthUrl,
        params: params.toString()
      });
      window.location.href = epicOAuthUrl;

    } catch (error) {
      console.error('Epic OAuth error:', error);
      onError(error instanceof Error ? error.message : 'Failed to connect Epic account');
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={(e) => {
        console.log('Button clicked!', e);
        handleEpicConnect();
      }}
      disabled={isLoading || !user}
      className="w-full px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      style={{ cursor: (isLoading || !user) ? 'not-allowed' : 'pointer' }}
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          Connecting...
        </>
      ) : (
        <>
          <div className="w-5 h-5 bg-white rounded-lg flex items-center justify-center">
            <img 
              src="/Black PathGen logo.png" 
              alt="PathGen Logo" 
              className="w-4 h-4"
            />
          </div>
          Connect Epic Account
        </>
      )}
    </button>
  );
}
