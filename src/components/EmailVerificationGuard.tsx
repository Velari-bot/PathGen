'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface EmailVerificationGuardProps {
  children: React.ReactNode;
}

export default function EmailVerificationGuard({ children }: EmailVerificationGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && !user.emailVerified) {
      // If user is logged in but email is not verified, redirect to verification page
      router.push('/verify-email');
    }
  }, [user, loading, router]);

  // Show loading while checking auth status
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <p className="text-white text-lg">Loading...</p>
      </div>
    );
  }

  // If no user, don't render children (will redirect to login)
  if (!user) {
    return null;
  }

  // If user is not verified, don't render children (will redirect to verification page)
  if (!user.emailVerified) {
    return null;
  }

  // If user is verified, render children
  return <>{children}</>;
}
