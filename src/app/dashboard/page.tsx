'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      checkSubscription();
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
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />
      
      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20">
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
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* AI Coaching Card */}
            <div className="glass-card p-6 text-center">
              <div className="text-4xl mb-4 flex justify-center">
                <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
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
              <div className="text-4xl mb-4 flex justify-center">
                <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
                </svg>
              </div>
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
              <div className="text-4xl mb-4 flex justify-center">
                <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/>
                </svg>
              </div>
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
              <div className="text-6xl mb-4 flex justify-center">
                <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0 1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10z"/>
                </svg>
              </div>
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
                  className="w-full bg-white text-dark-charcoal hover:bg-gray-100 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                  </svg>
                  Refresh Subscription Status
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
  );
}
