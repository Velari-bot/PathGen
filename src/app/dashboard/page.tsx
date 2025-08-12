'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface EpicAccount {
  id: string;
  displayName: string;
  platform: string;
  linkedAt: string;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [linkedEpicAccount, setLinkedEpicAccount] = useState<EpicAccount | null>(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      checkSubscription();
      loadLinkedEpicAccount();
    }
  }, [user]);

  const checkSubscription = async () => {
    try {
      const response = await fetch('/api/check-subscription');
      if (response.ok) {
        const data = await response.json();
        setHasActiveSubscription(data.hasActiveSubscription);
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
    <div className="min-h-screen bg-gradient-dark flex">
      {/* Navigation Sidebar */}
      <div 
        className={`fixed left-0 top-0 h-full bg-dark-gray/90 backdrop-blur-md border-r border-white/10 transition-all duration-300 z-40 ${
          sidebarExpanded ? 'w-64' : 'w-16'
        }`}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        <div className="p-4">
          {/* Logo */}
          <div className="flex items-center mb-8">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <div className="relative w-6 h-6">
                <Image
                  src="/Black PathGen logo.png"
                  alt="PathGen AI Logo"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            {sidebarExpanded && (
              <span className="ml-3 text-white font-bold text-lg">PathGen</span>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="space-y-2">
            <Link href="/dashboard" className="flex items-center p-3 text-white hover:bg-white/10 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
              </svg>
              {sidebarExpanded && <span className="ml-3">Dashboard</span>}
            </Link>
            
            <Link href="/ai" className="flex items-center p-3 text-white hover:bg-white/10 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              {sidebarExpanded && <span className="ml-3">AI Assistant</span>}
            </Link>
            
            <Link href="/settings" className="flex items-center p-3 text-white hover:bg-white/10 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {sidebarExpanded && <span className="ml-3">Settings</span>}
            </Link>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarExpanded ? 'ml-64' : 'ml-16'}`}>
        <Navbar />
        
        <div className="pt-20 px-6 py-8">
          {/* Payment Overlay for Unpaid Users */}
          {!hasActiveSubscription && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="glass-card p-8 max-w-md mx-4 text-center">
                <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <div className="relative w-16 h-16">
                    <Image
                      src="/Black PathGen logo.png"
                      alt="PathGen AI Logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-4">
                  You need to pay to use this app
                </h2>
                
                <p className="text-secondary-text mb-6">
                  Subscribe to PathGen AI Pro to unlock your personalized Fortnite coaching dashboard.
                </p>
                
                <div className="space-y-3">
                  <Link href="/pricing" className="w-full btn-primary py-3 block">
                    Subscribe Now - $3.99/month
                  </Link>
                  
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

          {/* Dashboard Content */}
          <div className={`${!hasActiveSubscription ? 'blur-sm pointer-events-none' : ''}`}>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome back, {user.email?.split('@')[0] || 'Player'}! 👋
              </h1>
              <p className="text-secondary-text">
                Here's your personalized Fortnite improvement dashboard
              </p>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Recent Routes</h3>
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-2">12</div>
                <p className="text-secondary-text text-sm">Generated this week</p>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Saved Favorites</h3>
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-2">8</div>
                <p className="text-secondary-text text-sm">Favorite strategies</p>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">AI Sessions</h3>
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-2">24</div>
                <p className="text-secondary-text text-sm">This month</p>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Win Rate</h3>
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-2">18.5%</div>
                <p className="text-secondary-text text-sm">+2.3% this week</p>
              </div>
            </div>

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Mini Map Widget */}
              <div className="lg:col-span-2">
                <div className="glass-card p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Last Generated Path</h3>
                  <div className="bg-white/5 rounded-lg p-4 h-64 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                      </div>
                      <p className="text-secondary-text">Map visualization coming soon</p>
                      <p className="text-white text-sm mt-2">Route: Retail Row → Salty Springs</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="glass-card p-6">
                <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link href="/ai" className="w-full btn-primary py-3 text-center block">
                    New Route
                  </Link>
                  <button className="w-full btn-secondary py-3">
                    Edit Preferences
                  </button>
                  <button className="w-full btn-secondary py-3">
                    View History
                  </button>
                  <button className="w-full btn-secondary py-3">
                    Export Data
                  </button>
                </div>
              </div>
            </div>

            {/* Usage Graph */}
            <div className="glass-card p-6 mb-8">
              <h3 className="text-xl font-bold text-white mb-4">Usage Analytics</h3>
              <div className="h-48 bg-white/5 rounded-lg p-4 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-secondary-text">Usage graph coming soon</p>
                  <p className="text-white text-sm mt-2">Token usage and session data</p>
                </div>
              </div>
            </div>

            {/* Fortnite AI Insights */}
            <div className="glass-card p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Your Fortnite AI Insights</h3>
                <Link href="/ai" className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all duration-300 text-sm">
                  Ask AI
                </Link>
              </div>
              
              {/* Epic Account Status */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">🎮 Epic Account Status</h4>
                    <p className="text-xs text-secondary-text">
                      {linkedEpicAccount 
                        ? `Connected: ${linkedEpicAccount.displayName}`
                        : 'No Fortnite account linked'
                      }
                    </p>
                  </div>
                  {!linkedEpicAccount && (
                    <Link 
                      href="/ai" 
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      Link Account
                    </Link>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
                  <h4 className="text-sm font-semibold text-white mb-2">🎯 Recent Tips</h4>
                  <p className="text-xs text-secondary-text">
                    {linkedEpicAccount 
                      ? 'Get personalized coaching based on your actual Fortnite performance!'
                      : 'Connect your Epic account to get personalized coaching advice based on your actual performance!'
                    }
                  </p>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg">
                  <h4 className="text-sm font-semibold text-white mb-2">📈 Performance</h4>
                  <p className="text-xs text-secondary-text">
                    {linkedEpicAccount 
                      ? 'Track your win rate changes, K/D improvements, and skill development over time.'
                      : 'Track your win rate changes, K/D improvements, and skill development over time with AI-powered insights.'
                    }
                  </p>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg">
                  <h4 className="text-sm font-semibold text-white mb-2">🚀 Skill Focus</h4>
                  <p className="text-xs text-secondary-text">
                    {linkedEpicAccount 
                      ? 'AI identifies your weakest areas and provides targeted practice routines.'
                      : 'AI identifies your weakest areas and provides targeted practice routines to improve specific skills.'
                    }
                  </p>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-white/5 rounded-lg">
                <p className="text-xs text-secondary-text text-center">
                  💡 <strong>Pro Tip:</strong> {linkedEpicAccount 
                    ? 'Your linked Epic account ensures the AI always has your latest stats for personalized advice.'
                    : 'Linking your Epic account ensures the AI always has your latest stats for personalized advice.'
                  }
                </p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-3 bg-white/5 rounded-lg">
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-white">AI coaching session completed</p>
                    <p className="text-secondary-text text-sm">2 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 p-3 bg-white/5 rounded-lg">
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-white">New route generated</p>
                    <p className="text-secondary-text text-sm">5 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 p-3 bg-white/5 rounded-lg">
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-white">Strategy saved to favorites</p>
                    <p className="text-secondary-text text-sm">1 day ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
