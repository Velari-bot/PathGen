'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function EmailVerificationBanner() {
  const { user, resendEmailVerification } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [lastResendTime, setLastResendTime] = useState<number>(0);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  // Don't show banner if user is not logged in or email is already verified
  if (!user || user.emailVerified) {
    return null;
  }

  // Check cooldown on component mount and every second
  useEffect(() => {
    const now = Date.now();
    const timeSinceLastResend = now - lastResendTime;
    const cooldownPeriod = 60000; // 1 minute cooldown
    
    if (timeSinceLastResend < cooldownPeriod) {
      setCooldownRemaining(Math.ceil((cooldownPeriod - timeSinceLastResend) / 1000));
    } else {
      setCooldownRemaining(0);
    }
    
    const interval = setInterval(() => {
      const currentTime = Date.now();
      const timeSinceLastResend = currentTime - lastResendTime;
      
      if (timeSinceLastResend < cooldownPeriod) {
        setCooldownRemaining(Math.ceil((cooldownPeriod - timeSinceLastResend) / 1000));
      } else {
        setCooldownRemaining(0);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [lastResendTime]);

  const handleResendVerification = async () => {
    if (isResending || cooldownRemaining > 0) return;
    
    setIsResending(true);
    setResendSuccess(false);
    
    try {
      await resendEmailVerification();
      setResendSuccess(true);
      setLastResendTime(Date.now());
      setTimeout(() => setResendSuccess(false), 5000); // Hide success message after 5 seconds
    } catch (error: any) {
      console.error('Error resending verification email:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/too-many-requests') {
        alert('Too many verification requests. Please wait a few minutes before trying again.');
        setLastResendTime(Date.now()); // Set cooldown even on error
      } else if (error.code === 'auth/user-not-found') {
        alert('User not found. Please try logging in again.');
      } else if (error.code === 'auth/network-request-failed') {
        alert('Network error. Please check your internet connection and try again.');
      } else {
        alert(`Failed to resend verification email: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6 mt-16 sm:mt-20">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <div className="text-yellow-400 mr-2">⚠️</div>
            <h3 className="text-yellow-400 font-semibold">Email Verification Required</h3>
          </div>
          <p className="text-yellow-300/80 text-sm mb-3">
            Please check your email ({user.email}) and click the verification link to complete your account setup.
          </p>
          {resendSuccess && (
            <p className="text-green-400 text-sm mb-2">
              ✅ Verification email sent! Check your inbox.
            </p>
          )}
          
          {/* Development Helper */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-3">
              <button
                onClick={() => setShowTroubleshooting(!showTroubleshooting)}
                className="text-blue-400 text-xs hover:text-blue-300 underline"
              >
                {showTroubleshooting ? 'Hide' : 'Show'} Troubleshooting Tips
              </button>
              {showTroubleshooting && (
                <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-300">
                  <p className="font-semibold mb-2">Development Troubleshooting:</p>
                  <ul className="space-y-1">
                    <li>• Check your spam/junk folder</li>
                    <li>• Verify Firebase Auth is enabled in your project</li>
                    <li>• Check Firebase Console → Authentication → Templates</li>
                    <li>• Ensure your email domain is not blocked</li>
                    <li>• Try using a different email address</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        <button
          onClick={handleResendVerification}
          disabled={isResending || cooldownRemaining > 0}
          className="btn-secondary text-sm px-4 py-2 ml-4 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isResending ? 'Sending...' : 
           cooldownRemaining > 0 ? `Wait ${cooldownRemaining}s` : 'Resend Email'}
        </button>
      </div>
    </div>
  );
}
