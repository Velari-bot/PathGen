'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CREDIT_PLANS, CreditSystem } from '@/lib/credit-system-client';

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
      // Get stored tracking code if available
      const trackingCode = localStorage.getItem('pathgen_tracking_code');
      
      // Redirect to Stripe checkout
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-email': user.email || 'customer@example.com',
          'tracking-code': trackingCode || '',
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
        { name: 'AI Chat Messages', free: '250/one-time', pro: '4,000/month' },
        { name: 'Personalized Strategies', free: 'Basic', pro: 'Advanced AI' },
        { name: 'Real-time Coaching', free: '❌', pro: '✅' },
        { name: 'Performance Analysis', free: 'Basic', pro: 'Deep Insights' }
      ]
    },
    {
      category: 'Fortnite Stats',
      features: [
        { name: 'Stats Lookup', free: '5/one-time', pro: '80/month' },
        { name: 'Match History', free: 'Last 10', pro: 'Complete History' },
        { name: 'Win Rate Tracking', free: 'Basic', pro: 'Advanced Analytics' },
        { name: 'Performance Trends', free: '❌', pro: '✅' }
      ]
    },
    {
      category: 'Replay Analysis',
      features: [
        { name: 'Replay Uploads', free: '12/one-time', pro: '200/month' },
        { name: 'AI Replay Analysis', free: '❌', pro: '✅' },
        { name: 'Performance Breakdown', free: '❌', pro: '✅' },
        { name: 'Improvement Suggestions', free: '❌', pro: '✅' }
      ]
    },
    {
      category: 'Tournament Tools',
      features: [
        { name: 'Tournament Strategies', free: '25/one-time', pro: '400/month' },
        { name: 'Meta Analysis', free: '❌', pro: '✅' },
        { name: 'Competitive Insights', free: '❌', pro: '✅' },
        { name: 'Pro Tips & Tricks', free: '❌', pro: '✅' }
      ]
    },
    {
      category: 'Experience',
      features: [
        { name: 'Ad-Free Experience', free: '❌', pro: '✅' },
        { name: 'Priority Support', free: '❌', pro: '✅' },
        { name: 'Early Access Features', free: '❌', pro: '✅' },
        { name: 'Exclusive Content', free: '❌', pro: '✅' }
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
            <span className="text-primary-text">Stop Guessing. Start Winning.</span>
            <br />
            <span className="text-gradient">AI Coaching Built for Fortnite Players.</span>
          </h1>
          <p className="text-xl md:text-2xl text-secondary-text max-w-3xl mx-auto leading-relaxed">
            Level up your gameplay with personalized strategies, replay breakdowns, and pro-level insights. Free to try. Game-changing when you go Pro.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16 max-w-5xl mx-auto">
          {/* Free Tier */}
          <div className="glass-card p-8 text-center relative">
            <h3 className="text-3xl font-bold text-primary-text mb-4">Free Plan</h3>
            <div className="mb-8">
              <span className="text-6xl font-bold text-white">$0</span>
              <span className="text-xl text-secondary-text">/one-time trial</span>
            </div>
            <p className="text-secondary-text mb-8">Perfect for getting started with PathGen AI</p>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-white font-semibold">250 AI Messages</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-white font-semibold">5 Stats Lookups</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-white font-semibold">12 Replay Uploads</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-white font-semibold">25 Tournament Strategies</span>
              </div>
              <div className="text-center text-sm text-secondary-text mt-4">
                One-time trial • No monthly commitment
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
            
            <h3 className="text-3xl font-bold text-primary-text mb-4">Pro Plan</h3>
            <div className="mb-8">
              <span className="text-6xl font-bold text-white">$6.99</span>
              <span className="text-xl text-secondary-text">/month</span>
            </div>
            <p className="text-secondary-text mb-8">Unlimited AI coaching credits, deep Osirion integration, and personalized strategies</p>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-white font-semibold">4,000 AI Messages</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-white font-semibold">80 Stats Lookups</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-white font-semibold">200 Replay Uploads</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
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
              {loading ? 'Processing...' : (user ? 'Unlock Pro Coaching – $6.99/month' : 'Sign In to Subscribe')}
            </button>
            
            <p className="text-xs text-secondary-text">Cancel anytime • 5-day money-back guarantee</p>
          </div>
        </div>

        {/* Detailed Feature Comparison */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="glass-card p-6">
            <h2 className="text-2xl font-bold text-center text-primary-text mb-8">
              Free vs Pro Comparison
            </h2>
            
            <div className="space-y-6">
              {features.map((category, categoryIndex) => (
                <div key={categoryIndex}>
                  <h3 className="text-lg font-bold text-white mb-4 text-center">{category.category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <h4 className="text-sm font-semibold text-secondary-text mb-3">Feature</h4>
                    </div>
                    <div className="text-center">
                      <h4 className="text-sm font-semibold text-secondary-text mb-3">Free</h4>
                    </div>
                    <div className="text-center">
                      <h4 className="text-sm font-semibold text-secondary-text mb-3">Pro</h4>
                    </div>
                    
                    {category.features.map((feature, featureIndex) => (
                      <React.Fragment key={featureIndex}>
                        <div className="text-center py-2">
                          <span className="text-white font-medium text-sm">{feature.name}</span>
                        </div>
                        <div className="text-center py-2">
                          <span className={`text-xs ${feature.free === '❌' ? 'text-red-400' : 'text-white'}`}>
                            {feature.free}
                          </span>
                        </div>
                        <div className="text-center py-2">
                          <span className={`text-xs ${feature.pro === '✅' ? 'text-green-400 font-bold' : 'text-white font-bold'}`}>
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
        </div>

        {/* Why Upgrade Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="glass-card p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              Why Players Upgrade to Pro
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="text-left">
                <div className="text-lg font-semibold text-red-400 mb-2">Free runs out FAST</div>
                <div className="text-secondary-text">250 AI messages is gone in a day of grinding.</div>
              </div>
              <div className="text-left">
                <div className="text-lg font-semibold text-green-400 mb-2">Pro gives unlimited progression</div>
                <div className="text-secondary-text">Stats, coaching, replay analysis, all unlocked.</div>
              </div>
              <div className="text-left">
                <div className="text-lg font-semibold text-blue-400 mb-2">Cheaper than a Battle Pass</div>
                <div className="text-secondary-text">But actually makes you better at Fortnite.</div>
              </div>
              <div className="text-left">
                <div className="text-lg font-semibold text-purple-400 mb-2">Perfect for competitive players</div>
                <div className="text-secondary-text">Real-time AI coaching + tournament prep.</div>
              </div>
            </div>
            
            {/* Scarcity Callout */}
            <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-lg p-6 mb-8">
              <h3 className="text-xl font-bold text-white mb-2">Free is a demo. Pro is the upgrade.</h3>
              <p className="text-secondary-text">Serious Fortnite players don't stop halfway.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => handleSubscribe('pro')}
                disabled={loading}
                className="btn-primary text-xl px-10 py-4 font-bold"
              >
                {loading ? 'Processing...' : 'Get PathGen Pro – $6.99/month'}
              </button>
            </div>
            <p className="text-sm text-secondary-text mt-4">Cancel anytime. Your wins won't.</p>
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
                <h3 className="text-2xl font-bold text-white mb-2">+47% Win Rate</h3>
                <p className="text-secondary-text">Average improvement for Pro users</p>
              </div>
              <div className="text-center">
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
              <h3 className="text-lg font-semibold text-white mb-3">Why not just play more?</h3>
              <p className="text-secondary-text">Practice doesn't equal improvement. PathGen AI identifies your specific weaknesses and gives you targeted strategies to fix them.</p>
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
