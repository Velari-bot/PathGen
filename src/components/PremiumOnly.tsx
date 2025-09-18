'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface PremiumOnlyProps {
  children: React.ReactNode;
  pageName?: string;
  description?: string;
  showNavbar?: boolean;
  showFooter?: boolean;
}

export default function PremiumOnly({ 
  children, 
  pageName = "Premium Feature", 
  description = "Access advanced features and unlock your competitive potential",
  showNavbar = true,
  showFooter = true
}: PremiumOnlyProps) {
  const { user, loading } = useAuth();
  const { subscription, loading: subscriptionLoading, refreshSubscription } = useSubscription();

  // Show loading while checking auth/subscription status
  if (loading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-secondary-text">Loading...</p>
        </div>
      </div>
    );
  }

  // Debug: Log the subscription data we're checking
  console.log('🔍 PremiumOnly: Checking subscription access', {
    user: !!user,
    subscription,
    tier: subscription?.tier,
    status: subscription?.status
  });

  // Check if user has pro subscription with multiple fallbacks
  const hasPro = subscription?.tier === 'pro' || 
                 subscription?.status === 'pro';

  // If user has pro access, show the content
  if (user && hasPro) {
    console.log('✅ PremiumOnly: User has Pro access, showing content');
    return <>{children}</>;
  }

  // If we have a user but no subscription data yet, try refreshing
  if (user && !subscription && refreshSubscription) {
    console.log('🔄 PremiumOnly: No subscription data found, refreshing...');
    refreshSubscription();
  }

  // Premium upgrade prompt for non-pro users
  const upgradePrompt = (
    <div className="min-h-screen bg-gradient-dark flex flex-col">
      {showNavbar && <Navbar />}
      
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full space-y-8 text-center">
          
          {/* Lock Icon */}
          <div className="mx-auto w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          {/* Title */}
          <div>
            <h2 className="mt-6 text-3xl font-extrabold text-white">
              🏆 Premium Feature
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              {pageName}
            </p>
          </div>

          {/* Description */}
          <div className="bg-white/5 rounded-lg p-6 border border-white/10">
            <p className="text-gray-300 text-sm leading-relaxed">
              {description}
            </p>
          </div>

          {/* Premium Features List */}
          <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg p-6 border border-yellow-500/20">
            <h3 className="text-lg font-semibold text-yellow-400 mb-4">🚀 Pro Features Include:</h3>
            <ul className="space-y-2 text-sm text-gray-300 text-left">
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Tournament tracking & strategies
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Advanced dashboard & analytics
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                POI analysis & map insights
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Performance tracking & stats
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Unlimited AI coaching sessions
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Priority support & updates
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            {user ? (
              // User is logged in but doesn't have pro
              <>
                <Link
                  href="/pricing"
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all duration-200"
                >
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <svg className="h-5 w-5 text-yellow-300 group-hover:text-yellow-200" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  🚀 Upgrade to Pro
                </Link>
                
                <Link
                  href="/ai"
                  className="w-full flex justify-center py-3 px-4 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                >
                  ← Back to Free AI Chat
                </Link>
              </>
            ) : (
              // User is not logged in
              <>
                <Link
                  href="/login"
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all duration-200"
                >
                  Sign In to Access Pro Features
                </Link>
                
                <p className="text-xs text-gray-400">
                  Don't have an account?{' '}
                  <Link href="/login" className="text-yellow-400 hover:text-yellow-300">
                    Sign up for free AI coaching
                  </Link>
                </p>
              </>
            )}
          </div>

          {/* Free Feature Note */}
          <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
            <p className="text-blue-300 text-xs">
              💡 <strong>Free users get unlimited AI coaching</strong><br />
              No credit limits on the main AI chat feature!
            </p>
          </div>
        </div>
      </div>

      {showFooter && <Footer />}
    </div>
  );

  return upgradePrompt;
}
