'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function EmailVerificationBanner() {
  const { user, resendEmailVerification } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Don't show banner if user is not logged in or email is already verified
  if (!user || user.emailVerified) {
    return null;
  }

  const handleResendVerification = async () => {
    if (isResending) return;
    
    setIsResending(true);
    setResendSuccess(false);
    
    try {
      await resendEmailVerification();
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000); // Hide success message after 5 seconds
    } catch (error: any) {
      console.error('Error resending verification email:', error);
      alert('Failed to resend verification email. Please try again.');
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
        </div>
        <button
          onClick={handleResendVerification}
          disabled={isResending}
          className="btn-secondary text-sm px-4 py-2 ml-4 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isResending ? 'Sending...' : 'Resend Email'}
        </button>
      </div>
    </div>
  );
}
