'use client';

import React, { useState } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { SubscriptionTier, PLAN_LIMITS, STRIPE_PRICE_IDS } from '@/types/subscription';
import { UsageIndicator } from './FeatureGate';

interface SubscriptionManagerProps {
  className?: string;
}

export function SubscriptionManager({ className = '' }: SubscriptionManagerProps) {
  const { 
    subscription, 
    loading, 
    error, 
    usage, 
    limits,
    createCheckoutSession,
    cancelSubscription,
    updatePaymentMethod 
  } = useSubscription();

  const [upgrading, setUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  const getTierDisplayName = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'free': return 'Free';
      case 'standard': return 'Standard';
      case 'pro': return 'Pro';
      default: return tier;
    }
  };

  const getTierColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'free': return 'text-gray-600 bg-gray-100';
      case 'standard': return 'text-blue-600 bg-blue-100';
      case 'pro': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTierPrice = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'free': return 'Free';
      case 'standard': return '$9.99/month';
      case 'pro': return '$19.99/month';
      default: return 'Free';
    }
  };

  const handleUpgrade = async (tier: SubscriptionTier) => {
    if (tier === 'free') return;
    
    setUpgrading(true);
    setUpgradeError(null);

    try {
      // Get the price ID for the tier
      const priceId = STRIPE_PRICE_IDS[tier];
      if (!priceId) {
        throw new Error('Invalid subscription tier');
      }

      const checkoutUrl = await createCheckoutSession({
        priceId,
        successUrl: `${window.location.origin}/dashboard?success=true&plan=${tier}`,
        cancelUrl: `${window.location.origin}/dashboard?canceled=true`
      });

      // Redirect to Stripe checkout
      window.location.href = checkoutUrl;
    } catch (error: any) {
      setUpgradeError(error.message || 'Failed to create checkout session');
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        <span className="ml-3 text-gray-600">Loading subscription...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-red-800">Error: {error}</span>
        </div>
      </div>
    );
  }

  const currentTier = subscription?.tier || 'free';
  const currentStatus = subscription?.status || 'free';

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Current Subscription Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Current Plan</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTierColor(currentTier)}`}>
            {getTierDisplayName(currentTier)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{getTierPrice(currentTier)}</div>
            <div className="text-sm text-gray-600">Billing</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {currentStatus === 'active' ? 'Active' : 
               currentStatus === 'past_due' ? 'Past Due' : 
               currentStatus === 'canceled' ? 'Canceled' : 'Free'}
            </div>
            <div className="text-sm text-gray-600">Status</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {subscription?.startDate ? 'Yes' : 'No'}
            </div>
            <div className="text-sm text-gray-600">Auto-renew</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {currentTier !== 'free' && (
            <>
              <button
                onClick={() => updatePaymentMethod()}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Update Payment Method
              </button>
              <button
                onClick={() => cancelSubscription()}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                Cancel Subscription
              </button>
            </>
          )}
        </div>
      </div>

      {/* Usage Overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Usage This Month</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <UsageIndicator feature="message" />
          <UsageIndicator feature="data_pull" />
          <UsageIndicator feature="tournament_strategy" />
          {currentTier !== 'free' && (
            <>
              <UsageIndicator feature="replay_upload" />
              <UsageIndicator feature="tokens" />
            </>
          )}
        </div>
      </div>

      {/* Plan Comparison */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(['free', 'standard', 'pro'] as SubscriptionTier[]).map((tier) => (
            <div
              key={tier}
              className={`relative p-6 rounded-lg border-2 transition-all duration-200 ${
                tier === currentTier
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {tier === currentTier && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Current Plan
                  </span>
                </div>
              )}

              <div className="text-center mb-4">
                <h4 className={`text-xl font-bold ${getTierColor(tier).split(' ')[0]}`}>
                  {getTierDisplayName(tier)}
                </h4>
                <div className="text-3xl font-bold text-gray-900 mt-2">
                  {getTierPrice(tier)}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Messages</span>
                  <span className="font-medium">{PLAN_LIMITS[tier].monthlyMessages}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Data Pulls</span>
                  <span className="font-medium">{PLAN_LIMITS[tier].monthlyDataPulls}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Tournament Strategies</span>
                  <span className="font-medium">{PLAN_LIMITS[tier].tournamentStrategies}</span>
                </div>
                {tier !== 'free' && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Replay Uploads</span>
                    <span className="font-medium">{PLAN_LIMITS[tier].replayUploads}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Advanced Analytics</span>
                  <span className="font-medium">
                    {PLAN_LIMITS[tier].advancedAnalytics ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Priority Support</span>
                  <span className="font-medium">
                    {PLAN_LIMITS[tier].prioritySupport ? '✓' : '✗'}
                  </span>
                </div>
              </div>

              {tier !== currentTier && (
                <button
                  onClick={() => handleUpgrade(tier)}
                  disabled={upgrading}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                    tier === 'free'
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600 transform hover:scale-105'
                  }`}
                >
                  {upgrading ? 'Processing...' : tier === 'free' ? 'Current Plan' : 'Upgrade'}
                </button>
              )}
            </div>
          ))}
        </div>

        {upgradeError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800">{upgradeError}</span>
            </div>
          </div>
        )}
      </div>

      {/* Payment Method Info */}
      {subscription?.paymentMethod && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Payment Method</h3>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600">
                {subscription.paymentMethod.brand.toUpperCase()}
              </span>
            </div>
            <div>
              <div className="font-medium text-gray-900">
                •••• •••• •••• {subscription.paymentMethod.last4}
              </div>
              <div className="text-sm text-gray-600">
                Expires {subscription.paymentMethod.expMonth}/{subscription.paymentMethod.expYear}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
