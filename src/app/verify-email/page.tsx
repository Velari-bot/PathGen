'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EmailVerificationBanner from '@/components/EmailVerificationBanner';

export default function VerifyEmailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && user.emailVerified) {
      // If user is logged in and email is verified, redirect to dashboard
      router.push('/dashboard');
    } else if (!loading && !user) {
      // If no user is logged in, redirect to login page
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || (user && user.emailVerified)) {
    // Show loading or nothing if already verified (will redirect)
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <p className="text-white text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark flex flex-col">
      <Navbar />
      <EmailVerificationBanner />
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
          Verify Your Email
        </h1>
        <p className="text-lg text-secondary-text mb-8 max-w-2xl">
          Please check your inbox for a verification email. Click the link in the email to activate your account.
        </p>
        <p className="text-md text-secondary-text max-w-2xl">
          If you don't see it, please check your spam folder or use the resend option above.
        </p>
      </div>
      <Footer />
    </div>
  );
}
