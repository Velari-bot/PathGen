'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';


export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const { subscription } = useSubscription();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Check if user has pro subscription
  const hasPro = subscription?.tier === 'pro' || subscription?.status === 'pro';
  
  // Premium navigation link component
  const PremiumLink = ({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) => (
    <div className="relative group">
      <Link href={href} className={`${className} ${!hasPro ? 'opacity-60' : ''}`}>
        {children}
      </Link>
      {!hasPro && (
        <span className="absolute -top-1 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-full animate-pulse">
          PRO
        </span>
      )}
    </div>
  );
  
  // Mobile premium navigation link component
  const MobilePremiumLink = ({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) => (
    <div className="relative">
      <Link href={href} className={`${className} ${!hasPro ? 'opacity-60' : ''} flex items-center justify-between`}>
        <span>{children}</span>
        {!hasPro && (
          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-2 py-1 rounded-full">
            PRO
          </span>
        )}
      </Link>
    </div>
  );

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Show loading state while Firebase is initializing
  if (loading) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 nav-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="relative w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-lg">
                <div className="relative w-6 h-6">
                                  <Image
                  src="/Black PathGen logo.png"
                  alt="PathGen AI Logo"
                  fill
                  sizes="24px"
                  className="object-contain"
                />
                </div>
              </div>
              <span className="text-xl font-bold text-primary-text">PathGen AI</span>
            </Link>
            <div className="animate-pulse bg-light-gray h-8 w-32 rounded"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 nav-glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mobile-container">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group touch-friendly">
            <div className="relative w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-lg flex items-center justify-center group-hover:shadow-lg group-hover:shadow-white/50 transition-all duration-300">
              <div className="relative w-5 h-5 sm:w-6 sm:h-6">
                <Image
                  src="/Black PathGen logo.png"
                  alt="PathGen AI Logo"
                  fill
                  sizes="(max-width: 640px) 20px, 24px"
                  className="object-contain"
                />
              </div>
            </div>
            <span className="text-lg sm:text-xl font-bold text-primary-text group-hover:text-gradient transition-all duration-300">PathGen AI</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {user ? (
              <>
                <PremiumLink href="/dashboard" className="text-secondary-text hover:text-white transition-colors duration-300">
                  Dashboard
                </PremiumLink>
                <Link href="/ai" className="text-secondary-text hover:text-white transition-colors duration-300">
                  <span className="flex items-center">
                    AI Coach
                    <span className="ml-1.5 bg-white text-black text-xs font-bold px-1.5 py-0.5 rounded-full">
                      FREE
                    </span>
                  </span>
                </Link>
                <PremiumLink href="/tournaments" className="text-secondary-text hover:text-white transition-colors duration-300">
                  Tournaments
                </PremiumLink>
                <PremiumLink href="/tournament-strategy" className="text-secondary-text hover:text-white transition-colors duration-300">
                  Strategies
                </PremiumLink>
                <Link href="/pricing" className="text-secondary-text hover:text-white transition-colors duration-300">
                  Pricing
                </Link>
                <PremiumLink href="/settings" className="text-secondary-text hover:text-white transition-colors duration-300">
                  Settings
                </PremiumLink>
                
                <button
                  onClick={handleLogout}
                  className="btn-secondary"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/#features" className="text-secondary-text hover:text-white transition-colors duration-300">
                  Features
                </Link>
                <Link href="/pricing" className="text-secondary-text hover:text-white transition-colors duration-300">
                  Pricing
                </Link>
                <Link href="/login" className="btn-secondary relative overflow-hidden" style={{
                  animation: 'pulse-glow 2s ease-in-out infinite',
                  boxShadow: '0 0 20px rgba(255, 255, 255, 0.3), 0 0 40px rgba(255, 255, 255, 0.2), 0 0 60px rgba(255, 255, 255, 0.1)'
                }}>
                  <span className="relative z-10">Sign In</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-white/20 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-secondary-text hover:text-white focus:outline-none focus:text-white transition-colors duration-300 touch-friendly p-2"
              aria-label="Toggle menu"
            >
              <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-dark-gray/90 backdrop-blur-md border-t border-white/10">
              {user ? (
                <>
                  <MobilePremiumLink href="/dashboard" className="block px-3 py-3 text-secondary-text hover:text-white transition-colors duration-300 touch-friendly text-base">
                    Dashboard
                  </MobilePremiumLink>
                  <Link href="/ai" className="block px-3 py-3 text-secondary-text hover:text-white transition-colors duration-300 touch-friendly text-base flex items-center justify-between">
                    <span>AI Coach</span>
                    <span className="bg-white text-black text-xs font-bold px-2 py-1 rounded-full">
                      FREE
                    </span>
                  </Link>
                  <MobilePremiumLink href="/tournaments" className="block px-3 py-3 text-secondary-text hover:text-white transition-colors duration-300 touch-friendly text-base">
                    Tournaments
                  </MobilePremiumLink>
                  <MobilePremiumLink href="/tournament-strategy" className="block px-3 py-3 text-secondary-text hover:text-white transition-colors duration-300 touch-friendly text-base">
                    Strategies
                  </MobilePremiumLink>
                  <Link href="/pricing" className="block px-3 py-3 text-secondary-text hover:text-white transition-colors duration-300 touch-friendly text-base">
                    Pricing
                  </Link>
                  <MobilePremiumLink href="/settings" className="block px-3 py-3 text-secondary-text hover:text-white transition-colors duration-300 touch-friendly text-base">
                    Settings
                  </MobilePremiumLink>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-3 text-secondary-text hover:text-white transition-colors duration-300 touch-friendly text-base"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/#features" className="block px-3 py-3 text-secondary-text hover:text-white transition-colors duration-300 touch-friendly text-base">
                    Features
                  </Link>
                  <Link href="/pricing" className="block px-3 py-3 text-secondary-text hover:text-white transition-colors duration-300 touch-friendly text-base">
                    Pricing
                  </Link>
                  <Link href="/login" className="block px-3 py-3 text-secondary-text hover:text-white transition-colors duration-300 touch-friendly text-base relative overflow-hidden" style={{
                    animation: 'pulse-glow 2s ease-in-out infinite',
                    boxShadow: '0 0 20px rgba(255, 255, 255, 0.3), 0 0 40px rgba(255, 255, 255, 0.2), 0 0 60px rgba(255, 255, 255, 0.1)'
                  }}>
                    <span className="relative z-10">Sign In</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-white/20 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
