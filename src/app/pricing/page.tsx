'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { SUBSCRIPTION_TIERS } from '@/lib/osirion';

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const [promoCodes, setPromoCodes] = useState({
    paid: '',
    pro: ''
  });
  const { user } = useAuth();
  const router = useRouter();

  const handleSubscribe = async (tier: 'paid' | 'pro') => {
    if (!user) {
      router.push('/login');
      return;
    }

    setLoading(true);
    
    try {
      // Redirect to Stripe checkout
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-email': user.email || 'customer@example.com',
        },
        body: JSON.stringify({
          priceId: tier === 'paid' ? 'price_1RvsvqCitWuvPenEw9TefOig' : 'price_1RvsyxCitWuvPenEOtFzt5FC', // Standard and Pro tier price IDs
          userId: user.uid,
          tier: tier,
          promoCode: promoCodes[tier as keyof typeof promoCodes] || null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      alert(`Payment Error: ${error.message || 'Failed to create checkout session. Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark flex flex-col">
      <Navbar />
      
      {/* Main Content */}
      <div className="flex-1 relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
            <span className="text-primary-text">Choose Your</span>
            <br />
            <span className="text-gradient">PathGen Plan</span>
          </h1>
          <p className="text-xl md:text-2xl text-secondary-text max-w-3xl mx-auto leading-relaxed">
            Select the perfect plan to accelerate your Fortnite journey with Osirion-powered analytics and AI coaching.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12 max-w-6xl mx-auto">
          {/* Free Tier */}
          <div className="glass-card p-6 text-center">
            <h3 className="text-2xl font-bold text-primary-text mb-4">{SUBSCRIPTION_TIERS.free.name}</h3>
            <div className="mb-6">
              <span className="text-5xl font-bold text-white">${SUBSCRIPTION_TIERS.free.price}</span>
              <span className="text-lg text-secondary-text">1 time</span>
            </div>
            <div className="text-left space-y-3 mb-6">
              {SUBSCRIPTION_TIERS.free.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-dark-charcoal" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-white">{feature}</span>
                </div>
              ))}
            </div>
            <button className="w-full btn-secondary py-3">
              Current Plan
            </button>
          </div>

          {/* Standard Tier */}
          <div className="glass-card p-6 text-center relative border-2 border-white/20">
            {/* Popular Badge */}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-white to-gray-200 text-dark-charcoal px-4 py-1 rounded-full font-semibold text-sm">
              MOST POPULAR
            </div>
            
            <h3 className="text-2xl font-bold text-primary-text mb-4">{SUBSCRIPTION_TIERS.paid.name}</h3>
            <div className="mb-6">
              <span className="text-5xl font-bold text-white">${SUBSCRIPTION_TIERS.paid.price}</span>
              <span className="text-lg text-secondary-text">/month</span>
            </div>
            <div className="text-left space-y-3 mb-6">
              {SUBSCRIPTION_TIERS.paid.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-dark-charcoal" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-white">{feature}</span>
                </div>
              ))}
            </div>
            {/* Promo Code Input */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Enter promo code"
                value={promoCodes.paid}
                onChange={(e) => setPromoCodes(prev => ({ ...prev, paid: e.target.value }))}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 mb-2"
              />
              {promoCodes.paid && (
                <div className="text-xs text-green-400">
                  🎫 Promo code applied: {promoCodes.paid}
                </div>
              )}
            </div>
            
            <button
              onClick={() => handleSubscribe('paid')}
              disabled={loading}
              className="w-full btn-primary text-lg py-3 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : (user ? 'Subscribe Now' : 'Sign In to Subscribe')}
            </button>
          </div>

          {/* Pro Tier */}
          <div className="glass-card p-6 text-center">
            <h3 className="text-2xl font-bold text-primary-text mb-4">{SUBSCRIPTION_TIERS.pro.name}</h3>
            <div className="mb-6">
              <span className="text-5xl font-bold text-white">${SUBSCRIPTION_TIERS.pro.price}</span>
              <span className="text-lg text-secondary-text">/month</span>
            </div>
            <div className="text-left space-y-3 mb-6">
              {SUBSCRIPTION_TIERS.pro.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-dark-charcoal" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-white">{feature}</span>
                </div>
              ))}
            </div>
            {/* Promo Code Input */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Enter promo code"
                value={promoCodes.pro}
                onChange={(e) => setPromoCodes(prev => ({ ...prev, pro: e.target.value }))}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-right focus:border-white/40 mb-2"
              />
              {promoCodes.pro && (
                <div className="text-xs text-green-400">
                  🎫 Promo code applied: {promoCodes.pro}
                </div>
                )}
            </div>
            
            <button
              onClick={() => handleSubscribe('pro')}
              disabled={loading}
              className="w-full btn-primary text-lg py-3 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : (user ? 'Subscribe Now' : 'Sign In to Subscribe')}
            </button>
          </div>
        </div>

        {/* Osirion Integration Section */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="glass-card p-8 text-center">
            <h2 className="text-3xl font-bold text-primary-text mb-4">
              Powered by Osirion
            </h2>
            <p className="text-lg text-secondary-text mb-6">
              Advanced Fortnite analytics, match history, and replay analysis powered by the industry-leading Osirion API.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Match Analytics</h3>
                <ul className="text-secondary-text space-y-2">
                  <li>• Detailed match history and statistics</li>
                  <li>• Performance tracking and trends</li>
                  <li>• Advanced event analysis</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Replay Analysis</h3>
                <ul className="text-secondary-text space-y-2">
                  <li>• Upload and analyze replay files</li>
                  <li>• Deep performance insights</li>
                  <li>• AI-powered coaching recommendations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-primary-text mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Can I cancel anytime?</h3>
              <p className="text-secondary-text">Yes, you can cancel your subscription at any time. No questions asked.</p>
            </div>
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-3">What payment methods do you accept?</h3>
              <p className="text-secondary-text">We accept all major credit cards, debit cards, and digital wallets via Stripe.</p>
            </div>
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Do you offer refunds?</h3>
              <p className="text-secondary-text">We offer a 30-day money-back guarantee if you're not satisfied.</p>
            </div>
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-3">How does the AI coaching work?</h3>
              <p className="text-secondary-text">Our AI analyzes your gameplay and provides personalized training plans to improve your Fortnite skills.</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
