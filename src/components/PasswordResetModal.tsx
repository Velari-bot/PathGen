'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PasswordResetModal({ isOpen, onClose }: PasswordResetModalProps) {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setIsSending(true);
    setError('');
    
    try {
      await sendPasswordReset(email);
      setIsSent(true);
      setTimeout(() => {
        onClose();
        setIsSent(false);
        setEmail('');
      }, 3000);
    } catch (error: any) {
      console.error('Password reset error:', error);
      setError(error.message || 'Failed to send password reset email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-gray border border-white/10 rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Reset Password</h2>
          <button
            onClick={onClose}
            className="text-secondary-text hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {!isSent ? (
          <form onSubmit={handleSubmit}>
            <p className="text-secondary-text mb-4">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-light-gray border border-white/10 rounded-lg text-white placeholder-secondary-text focus:outline-none focus:border-white/30"
                placeholder="Enter your email"
                disabled={isSending}
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm mb-4">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-secondary-text hover:text-white transition-colors"
                disabled={isSending}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSending}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center">
            <div className="text-green-400 text-4xl mb-4">✅</div>
            <h3 className="text-white font-semibold mb-2">Check Your Email</h3>
            <p className="text-secondary-text">
              We've sent a password reset link to <span className="text-white">{email}</span>
            </p>
            <p className="text-secondary-text text-sm mt-2">
              This modal will close automatically in a few seconds...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
