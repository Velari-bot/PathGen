'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative w-8 h-8 bg-white rounded-lg flex items-center justify-center group-hover:shadow-lg group-hover:shadow-white/50 transition-all duration-300">
              <div className="relative w-6 h-6">
                <Image
                  src="/Black PathGen logo.png"
                  alt="PathGen AI Logo"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            <span className="text-xl font-bold text-primary-text group-hover:text-gradient transition-all duration-300">PathGen AI</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {user ? (
              <>
                <Link href="/dashboard" className="text-secondary-text hover:text-white transition-colors duration-300">
                  Dashboard
                </Link>
                                 <Link href="/ai" className="text-secondary-text hover:text-white transition-colors duration-300">
                   AI Coach
                 </Link>
                                   <Link href="/poi-analysis" className="text-secondary-text hover:text-white transition-colors duration-300">
                    POI Analysis
                  </Link>
                  <Link href="/tournament-strategy" className="text-secondary-text hover:text-white transition-colors duration-300">
                    Tournament
                  </Link>
                <Link href="/settings" className="text-secondary-text hover:text-white transition-colors duration-300">
                  Settings
                </Link>
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
                <Link href="/login" className="btn-secondary">
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-secondary-text hover:text-white focus:outline-none focus:text-white transition-colors duration-300"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  <Link href="/dashboard" className="block px-3 py-2 text-secondary-text hover:text-white transition-colors duration-300">
                    Dashboard
                  </Link>
                                     <Link href="/ai" className="block px-3 py-2 text-secondary-text hover:text-white transition-colors duration-300">
                     AI Coach
                   </Link>
                                       <Link href="/poi-analysis" className="block px-3 py-2 text-secondary-text hover:text-white transition-colors duration-300">
                      POI Analysis
                    </Link>
                    <Link href="/tournament-strategy" className="block px-3 py-2 text-secondary-text hover:text-white transition-colors duration-300">
                      Tournament
                    </Link>
                  <Link href="/settings" className="block px-3 py-2 text-secondary-text hover:text-white transition-colors duration-300">
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 text-secondary-text hover:text-white transition-colors duration-300"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/#features" className="block px-3 py-2 text-secondary-text hover:text-white transition-colors duration-300">
                    Features
                  </Link>
                  <Link href="/pricing" className="block px-3 py-2 text-secondary-text hover:text-white transition-colors duration-300">
                    Pricing
                  </Link>
                  <Link href="/login" className="block px-3 py-2 text-secondary-text hover:text-white transition-colors duration-300">
                    Sign In
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
