'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SmoothScroll from '@/components/SmoothScroll';

interface EpicAccount {
  id: string;
  displayName: string;
  platform: string;
  linkedAt: string;
}

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [linkedEpicAccount, setLinkedEpicAccount] = useState<EpicAccount | null>(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [manualUsername, setManualUsername] = useState('');
  const [inputMethod, setInputMethod] = useState<'epic' | 'manual' | 'tracker'>('epic');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      checkSubscription();
      loadLinkedEpicAccount();
      // Load manual username if it exists
      const savedUsername = localStorage.getItem('pathgen_manual_username');
      if (savedUsername) {
        setManualUsername(savedUsername);
        setInputMethod('manual');
      }
    }
  }, [user]);

  const checkSubscription = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/check-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Subscription check result:', data);
        setHasActiveSubscription(data.hasActiveSubscription);
      } else {
        console.error('Subscription check failed:', response.status);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLinkedEpicAccount = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/user/get-epic-account?userId=${user.uid}`);
      if (response.ok) {
        const data = await response.json();
        setLinkedEpicAccount(data.epicAccount);
      }
    } catch (error) {
      console.error('Error loading linked Epic account:', error);
    }
  };

  const clearAccountInfo = () => {
    setLinkedEpicAccount(null);
    setManualUsername('');
    setInputMethod('epic');
    localStorage.removeItem('pathgen_manual_username');
  };

  // Check for success parameter from Stripe redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    
    if (success === 'true') {
      // Refresh subscription check after successful payment
      setTimeout(() => {
        window.location.reload();
      }, 2000); // Wait 2 seconds for webhook to process
    }
  }, []);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="relative w-12 h-12">
              <Image
                src="/Black PathGen logo.png"
                alt="PathGen AI Logo"
                fill
                className="object-contain"
              />
            </div>
          </div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SmoothScroll>
      <div className="min-h-screen bg-gradient-dark">
        <Navbar />
        
        {/* Main Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20">
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-20 w-32 h-32 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-40 h-40 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            
            {/* Moving Lines */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent animate-pulse"></div>
              <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent animate-pulse" style={{ animationDelay: '1s' }}></div>
              <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent animate-pulse" style={{ animationDelay: '2s' }}></div>
              <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent animate-pulse" style={{ animationDelay: '3s' }}></div>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              <span className="text-primary-text">Welcome to</span>
              <br />
              <span className="text-gradient">PathGen AI</span>
            </h1>
            <p className="text-xl text-secondary-text">
              Your personal Fortnite improvement dashboard
            </p>
          </div>

          {/* Dashboard Content */}
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Fortnite Account Status */}
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">🎮 Fortnite Account Status</h4>
                  <p className="text-xs text-secondary-text">
                    {(linkedEpicAccount || manualUsername)
                      ? `Connected: ${linkedEpicAccount?.displayName || manualUsername}${inputMethod === 'manual' ? ' (Manual)' : inputMethod === 'tracker' ? ' (Tracker)' : ''}`
                      : 'No Fortnite account linked'
                    }
                  </p>
                </div>
                <div className="flex gap-2">
                  {!(linkedEpicAccount || manualUsername) ? (
                    <Link
                      href="/ai"
                      className="px-3 py-2 bg-white text-dark-charcoal hover:bg-gray-100 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Link Account
                    </Link>
                  ) : (
                    <button
                      onClick={clearAccountInfo}
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* AI Coaching Card */}
              <div className="glass-card p-6 text-center">
                <div className="text-4xl mb-4">🤖</div>
                <h3 className="text-xl font-semibold text-white mb-2">AI Coaching</h3>
                <p className="text-secondary-text mb-4">
                  Get personalized Fortnite strategies and tips from our AI assistant
                </p>
                <Link href="/ai" className="btn-primary w-full">
                  Start Coaching
                </Link>
              </div>

              {/* Performance Tracking Card */}
              <div className="glass-card p-6 text-center">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-white mb-2">Performance Tracking</h3>
                <p className="text-secondary-text mb-4">
                  Monitor your progress with detailed stats and analytics
                </p>
                <Link href="/ai" className="btn-secondary w-full">
                  View Stats
                </Link>
              </div>

              {/* Strategy Library Card */}
              <div className="glass-card p-6 text-center">
                <div className="text-4xl mb-4">📚</div>
                <h3 className="text-xl font-semibold text-white mb-2">Strategy Library</h3>
                <p className="text-secondary-text mb-4">
                  Access a collection of proven Fortnite strategies and techniques
                </p>
                <Link href="/ai" className="btn-secondary w-full">
                  Browse Strategies
                </Link>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/ai" className="btn-secondary">
                  New AI Chat
                </Link>
                <Link href="/settings" className="btn-secondary">
                  Settings
                </Link>
                <button onClick={() => router.push('/')} className="btn-secondary">
                  Back to Home
                </button>
                <button onClick={logout} className="btn-secondary">
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Payment Gate Overlay */}
          {(!hasActiveSubscription && !isLoading) && (
            <div className="absolute inset-0 bg-dark-charcoal/90 backdrop-blur-md flex items-center justify-center z-30">
              <div className="text-center p-8 rounded-xl bg-dark-charcoal border border-white/10 shadow-lg max-w-md mx-auto">
                <div className="text-6xl mb-4">🔒</div>
                <h2 className="text-2xl font-bold text-white mb-4">Premium Features</h2>
                <p className="text-secondary-text mb-6">
                  Unlock the full potential of PathGen AI with our premium subscription. Get unlimited AI coaching, advanced analytics, and personalized strategies.
                </p>
                <div className="space-y-3">
                  <Link href="/pricing" className="w-full btn-primary py-3 block">
                    Subscribe Now - $3.99/month
                  </Link>
                  <button
                    onClick={checkSubscription}
                    className="w-full bg-white text-dark-charcoal hover:bg-gray-100 py-3 rounded-lg font-semibold transition-colors"
                  >
                    🔄 Refresh Subscription Status
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="w-full btn-secondary py-3"
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </SmoothScroll>
  );
}
