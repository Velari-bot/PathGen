'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const handleSubscribe = async () => {
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
          'user-email': user.email || 'customer@example.com', // Send user email
        },
        body: JSON.stringify({
          priceId: 'price_1RvNaoE1WEiMuZnCEjH3hnAp', // Updated Stripe Price ID
          userId: user.uid,
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
            Select the perfect plan to accelerate your Fortnite journey and dominate the competition.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12 max-w-5xl mx-auto">
          {/* Pro Plan - Left (Most Popular) */}
          <div className="glass-card p-6 text-center relative border-2 border-white/20">
            {/* Popular Badge */}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-white to-gray-200 text-dark-charcoal px-4 py-1 rounded-full font-semibold text-sm">
              MOST POPULAR
            </div>
            
            <h3 className="text-2xl font-bold text-primary-text mb-4">PathGen Pro</h3>
            <div className="mb-6">
              <span className="text-5xl font-bold text-white">$3.99</span>
              <span className="text-lg text-secondary-text">/month</span>
            </div>
            <div className="text-left space-y-3 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-dark-charcoal" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-white">Unlimited AI coaching sessions</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-dark-charcoal" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-white">Personalized training plans</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-dark-charcoal" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-white">Real-time performance tracking</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-dark-charcoal" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-white">Advanced analytics & insights</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-dark-charcoal" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-white">Priority customer support</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-dark-charcoal" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-white">Cancel anytime</span>
              </div>
            </div>
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full btn-primary text-lg py-3 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : (user ? 'Subscribe Now' : 'Sign In to Subscribe')}
            </button>
            <div className="text-secondary-text text-sm">
              <p>✓ No setup fees or hidden charges</p>
              <p>✓ Secure payment via Stripe</p>
            </div>
          </div>

          {/* Elite Plan - Right */}
          <div className="glass-card p-6 text-center">
            <h3 className="text-2xl font-bold text-primary-text mb-4">PathGen Elite</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold text-white">$7.99</span>
              <span className="text-lg text-secondary-text">/month</span>
            </div>
            <div className="text-left space-y-3 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-dark-charcoal" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-white">Everything in Pro</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-dark-charcoal" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-white">Custom crosshair & HUD</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-dark-charcoal" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-white">Advanced game configurations</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-dark-charcoal" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-white">Exclusive training maps</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-dark-charcoal" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-white">24/7 VIP support</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-dark-charcoal" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-white">Early access to new features</span>
              </div>
            </div>
            <button className="w-full btn-secondary py-3">
              Coming Soon
            </button>
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

        {/* Back to Home */}
        <div className="text-center mt-12">
          <Link href="/" className="text-secondary-text hover:text-white transition-colors duration-300 text-lg">
            ← Back to Home
          </Link>
        </div>

        {/* Setup Note */}
        <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-2">🚀 Setup Required</h3>
          <p className="text-secondary-text text-sm mb-3">
            To enable payments, you need to create a product in your Stripe dashboard and update the price ID in the code.
          </p>
          <div className="text-xs text-secondary-text space-y-1">
            <p>1. Go to <a href="https://dashboard.stripe.com/products" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">Stripe Dashboard → Products</a></p>
            <p>2. Create a product: "PathGen AI Pro" at $3.99/month</p>
            <p>3. Copy the price ID (starts with "price_")</p>
            <p>4. Update the priceId in src/app/pricing/page.tsx</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
