'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CREDIT_PLANS, CreditSystem } from '@/lib/credit-system';

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const [promoCodes, setPromoCodes] = useState({
    pro: ''
  });
  const { user } = useAuth();
  const router = useRouter();

  const handleSubscribe = async (tier: 'pro') => {
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
          priceId: 'price_1RvsvqCitWuvPenEw9TefOig', // Pro tier price ID
          userId: user.uid,
          tier: tier,
          promoCode: promoCodes.pro || null
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

  const features = [
    {
      category: 'AI Coaching',
      features: [
        { name: 'AI Chat Messages', free: '250/month', pro: '4,000/month', icon: '💬' },
        { name: 'Personalized Strategies', free: 'Basic', pro: 'Advanced AI', icon: '🎯' },
        { name: 'Real-time Coaching', free: '❌', pro: '✅', icon: '⚡' },
        { name: 'Performance Analysis', free: 'Basic', pro: 'Deep Insights', icon: '📊' }
      ]
    },
    {
      category: 'Fortnite Stats',
      features: [
        { name: 'Stats Lookup', free: '5/month', pro: '80/month', icon: '📈' },
        { name: 'Match History', free: 'Last 10', pro: 'Complete History', icon: '🏆' },
        { name: 'Win Rate Tracking', free: 'Basic', pro: 'Advanced Analytics', icon: '📊' },
        { name: 'Performance Trends', free: '❌', pro: '✅', icon: '📈' }
      ]
    },
    {
      category: 'Replay Analysis',
      features: [
        { name: 'Replay Uploads', free: '12/month', pro: '200/month', icon: '🎬' },
        { name: 'AI Replay Analysis', free: '❌', pro: '✅', icon: '🤖' },
        { name: 'Performance Breakdown', free: '❌', pro: '✅', icon: '📋' },
        { name: 'Improvement Suggestions', free: '❌', pro: '✅', icon: '💡' }
      ]
    },
    {
      category: 'Tournament Tools',
      features: [
        { name: 'Tournament Strategies', free: '25/month', pro: '400/month', icon: '🏅' },
        { name: 'Meta Analysis', free: '❌', pro: '✅', icon: '🎮' },
        { name: 'Competitive Insights', free: '❌', pro: '✅', icon: '🔍' },
        { name: 'Pro Tips & Tricks', free: '❌', pro: '✅', icon: '💎' }
      ]
    },
    {
      category: 'Experience',
      features: [
        { name: 'Ad-Free Experience', free: '❌', pro: '✅', icon: '🚫' },
        { name: 'Priority Support', free: '❌', pro: '✅', icon: '🎧' },
        { name: 'Early Access Features', free: '❌', pro: '✅', icon: '🚀' },
        { name: 'Exclusive Content', free: '❌', pro: '✅', icon: '⭐' }
      ]
    }
  ];

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
            Start free, upgrade when you're ready to dominate. No hidden fees, cancel anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16 max-w-5xl mx-auto">
          {/* Free Tier */}
          <div className="glass-card p-8 text-center relative">
            <h3 className="text-3xl font-bold text-primary-text mb-4">Free</h3>
            <div className="mb-8">
              <span className="text-6xl font-bold text-white">$0</span>
              <span className="text-xl text-secondary-text">/month</span>
            </div>
            <p className="text-secondary-text mb-8">Perfect for getting started with PathGen AI</p>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-2xl">💬</span>
                <span className="text-white font-semibold">250 AI Messages</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-2xl">📈</span>
                <span className="text-white font-semibold">5 Stats Lookups</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-2xl">🎬</span>
                <span className="text-white font-semibold">12 Replay Uploads</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-2xl">🏅</span>
                <span className="text-white font-semibold">25 Tournament Strategies</span>
              </div>
            </div>

            <button className="w-full btn-secondary py-4 text-lg font-semibold">
              {user ? 'Current Plan' : 'Get Started Free'}
            </button>
          </div>

          {/* Pro Tier */}
          <div className="glass-card p-8 text-center relative border-2 border-white/30 bg-gradient-to-br from-white/5 to-white/10">
            {/* Popular Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-dark-charcoal px-6 py-2 rounded-full font-bold text-sm shadow-lg">
              ⭐ MOST POPULAR
            </div>
            
            <h3 className="text-3xl font-bold text-primary-text mb-4">Pro</h3>
            <div className="mb-8">
              <span className="text-6xl font-bold text-white">$6.99</span>
              <span className="text-xl text-secondary-text">/month</span>
            </div>
            <p className="text-secondary-text mb-8">Unlock unlimited potential and dominate the competition</p>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-2xl">💬</span>
                <span className="text-white font-semibold">4,000 AI Messages</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-2xl">📈</span>
                <span className="text-white font-semibold">80 Stats Lookups</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-2xl">🎬</span>
                <span className="text-white font-semibold">200 Replay Uploads</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-2xl">🏅</span>
                <span className="text-white font-semibold">400 Tournament Strategies</span>
              </div>
            </div>

            {/* Promo Code Input */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Enter promo code"
                value={promoCodes.pro}
                onChange={(e) => setPromoCodes(prev => ({ ...prev, pro: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 mb-2"
              />
              {promoCodes.pro && (
                <div className="text-sm text-green-400">
                  🎫 Promo code applied: {promoCodes.pro}
                </div>
              )}
            </div>
            
            <button
              onClick={() => handleSubscribe('pro')}
              disabled={loading}
              className="w-full btn-primary text-lg py-4 font-semibold mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : (user ? 'Upgrade to Pro' : 'Sign In to Subscribe')}
            </button>
            
            <p className="text-xs text-secondary-text">Cancel anytime • 5-day money-back guarantee</p>
          </div>
        </div>

        {/* Detailed Feature Comparison */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center text-primary-text mb-12">
            Free vs Pro - What You Get
          </h2>
          
          <div className="space-y-8">
            {features.map((category, categoryIndex) => (
              <div key={categoryIndex} className="glass-card p-6">
                <h3 className="text-xl font-bold text-white mb-6 text-center">{category.category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <h4 className="text-lg font-semibold text-secondary-text mb-4">Feature</h4>
                  </div>
                  <div className="text-center">
                    <h4 className="text-lg font-semibold text-secondary-text mb-4">Free</h4>
                  </div>
                  <div className="text-center">
                    <h4 className="text-lg font-semibold text-secondary-text mb-4">Pro</h4>
                  </div>
                  
                  {category.features.map((feature, featureIndex) => (
                    <React.Fragment key={featureIndex}>
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{feature.icon}</span>
                        <span className="text-white font-medium">{feature.name}</span>
                      </div>
                      <div className="text-center">
                        <span className={`text-sm ${feature.free === '❌' ? 'text-red-400' : 'text-white'}`}>
                          {feature.free}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className={`text-sm ${feature.pro === '✅' ? 'text-green-400' : 'text-white'}`}>
                          {feature.pro}
                        </span>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Value Proposition */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="glass-card p-8 text-center">
            <h2 className="text-3xl font-bold text-primary-text mb-6">
              Why Players Choose Pro
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl mb-4">🚀</div>
                <h3 className="text-xl font-semibold text-white mb-2">16x More AI Messages</h3>
                <p className="text-secondary-text">Get unlimited coaching and never run out of credits</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold text-white mb-2">Advanced Analytics</h3>
                <p className="text-secondary-text">Deep insights that free users can't access</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-xl font-semibold text-white mb-2">Ad-Free Experience</h3>
                <p className="text-secondary-text">Focus on your game without distractions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="glass-card p-8 text-center">
            <h2 className="text-3xl font-bold text-primary-text mb-6">
              Trusted by Fortnite Players
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="text-center">
                <div className="text-6xl mb-4">📈</div>
                <h3 className="text-2xl font-bold text-white mb-2">+47% Win Rate</h3>
                <p className="text-secondary-text">Average improvement for Pro users</p>
              </div>
              <div className="text-center">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-2xl font-bold text-white mb-2">10,000+ Players</h3>
                <p className="text-secondary-text">Already using PathGen to improve</p>
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
              <p className="text-secondary-text">We offer a 5-day money-back guarantee if you're not satisfied.</p>
            </div>
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-3">How does the AI coaching work?</h3>
              <p className="text-secondary-text">Our AI analyzes your gameplay and provides personalized training plans to improve your Fortnite skills.</p>
            </div>
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-3">What happens to my credits when I upgrade?</h3>
              <p className="text-secondary-text">Your existing credits are preserved and you get the full Pro allocation immediately.</p>
            </div>
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Is there a free trial?</h3>
              <p className="text-secondary-text">Yes! Start with the free plan and upgrade when you're ready for unlimited access.</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
