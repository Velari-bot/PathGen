'use client';

import React, { useState, useEffect } from 'react';
import { epicService, EpicAccount } from '@/lib/epic';
import { useAuth } from '@/contexts/AuthContext';

interface EpicAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountLinked: (account: EpicAccount) => void;
}

export default function EpicAccountModal({ isOpen, onClose, onAccountLinked }: EpicAccountModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'choose' | 'oauth' | 'manual' | 'verification'>('choose');
  const [manualUsername, setManualUsername] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<EpicAccount | null>(null);
  const [error, setError] = useState('');

  // Handle OAuth callback if we're returning from Epic
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code && step === 'oauth') {
      handleOAuthCallback(code);
    }
  }, [step]);

  const handleOAuthCallback = async (code: string) => {
    try {
      const account = await epicService.handleOAuthCallback(code);
      if (account) {
        await linkAccount(account);
      } else {
        setError('Failed to authenticate with Epic Games');
        setStep('choose');
      }
    } catch (error) {
      setError('OAuth authentication failed');
      setStep('choose');
    }
  };

  const initiateOAuth = () => {
    setStep('oauth');
    setError('');
    epicService.initiateOAuth();
  };

  const handleManualVerification = async () => {
    if (!manualUsername.trim()) {
      setError('Please enter a username');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const account = await epicService.verifyAccount(manualUsername.trim());
      if (account) {
        setVerificationResult(account);
        setStep('verification');
      } else {
        setError('Username not found. Please check the spelling and try again.');
      }
    } catch (error) {
      setError('Failed to verify account');
    } finally {
      setIsVerifying(false);
    }
  };

  const linkAccount = async (account: EpicAccount) => {
    if (!user) {
      setError('You must be logged in to link an account');
      return;
    }

    try {
      const response = await fetch('/api/user/link-epic-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          epicAccount: account,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to link account');
      }

      onAccountLinked(account);
      onClose();
    } catch (error) {
      setError('Failed to link account to your profile');
    }
  };

  const confirmManualAccount = () => {
    if (verificationResult) {
      linkAccount(verificationResult);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-charcoal border border-white/20 rounded-xl p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Link Fortnite Account</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step 1: Choose Method */}
        {step === 'choose' && (
          <div className="space-y-4">
            <p className="text-secondary-text text-sm">
              Choose how you'd like to link your Fortnite account:
            </p>
            
            <button
              onClick={initiateOAuth}
              className="w-full p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              Connect with Epic Games
            </button>
            
            <button
              onClick={() => setStep('manual')}
              className="w-full p-4 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-colors border border-white/20"
            >
              Enter Username Manually
            </button>
          </div>
        )}

        {/* Step 2: Manual Username Entry */}
        {step === 'manual' && (
          <div className="space-y-4">
            <p className="text-secondary-text text-sm">
              Enter your Epic Games username to verify your account:
            </p>
            
            <input
              type="text"
              value={manualUsername}
              onChange={(e) => setManualUsername(e.target.value)}
              placeholder="Enter Epic username..."
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => setStep('choose')}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleManualVerification}
                disabled={isVerifying}
                className="flex-1 px-4 py-3 bg-white text-dark-charcoal rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {isVerifying ? 'Verifying...' : 'Verify Account'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Account Verification */}
        {step === 'verification' && verificationResult && (
          <div className="space-y-4">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <h3 className="text-green-400 font-semibold mb-2">Account Found!</h3>
              <div className="text-sm text-secondary-text space-y-1">
                <p><span className="text-white">Username:</span> {verificationResult.displayName}</p>
                <p><span className="text-white">Account ID:</span> {verificationResult.id}</p>
              </div>
            </div>
            
            <p className="text-secondary-text text-sm">
              This account will be linked to your PathGen profile. The AI will use your actual Fortnite stats for personalized coaching.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setStep('manual')}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                onClick={confirmManualAccount}
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
              >
                Link Account
              </button>
            </div>
          </div>
        )}

        {/* OAuth Step */}
        {step === 'oauth' && (
          <div className="text-center space-y-4">
            <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full mx-auto"></div>
            <p className="text-white">Redirecting to Epic Games...</p>
            <p className="text-secondary-text text-sm">
              You'll be redirected back here after authentication.
            </p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <p className="text-xs text-secondary-text text-center">
            Linking your account allows PathGen AI to provide personalized coaching based on your actual Fortnite performance data.
          </p>
        </div>
      </div>
    </div>
  );
}
