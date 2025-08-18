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
    if (!user) {
      onError('Please sign in to your account first');
      return;
    }

    setIsLoading(true);

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
        scope: 'basic_profile friends_list country presence',
        state: user.uid, // Pass user ID for security
      });

      // Redirect to Epic OAuth
      const epicOAuthUrl = `https://www.epicgames.com/id/authorize?${params.toString()}`;
      window.location.href = epicOAuthUrl;

    } catch (error) {
      console.error('Epic OAuth error:', error);
      onError(error instanceof Error ? error.message : 'Failed to connect Epic account');
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleEpicConnect}
      disabled={isLoading || !user}
      className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          Connecting...
        </>
      ) : (
        <>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          Connect Epic Account
        </>
      )}
    </button>
  );
}
