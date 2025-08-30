'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { adManager } from '@/lib/ad-manager';

export const AdAnalytics: React.FC = () => {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const subscriptionTier = subscription?.tier || 'free';
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('day');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && subscriptionTier === 'free') {
      loadStats();
    }
  }, [user, subscriptionTier, timeframe]);

  const loadStats = () => {
    setLoading(true);
    try {
      const revenueStats = adManager.getRevenueStats(user?.uid, timeframe);
      setStats(revenueStats);
    } catch (error) {
      console.error('Failed to load ad stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Only show for free tier users
  if (subscriptionTier !== 'free') {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-600 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-600 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getOptimizationTip = () => {
    if (stats.blockedRate > 50) {
      return {
        type: 'warning',
        message: 'High ad blocker rate detected. Consider implementing anti-ad-block measures.',
        action: 'Review ad placement strategy'
      };
    }
    
    if (stats.ctr < 1) {
      return {
        type: 'info',
        message: 'Low click-through rate. Consider A/B testing ad designs.',
        action: 'Optimize ad creative'
      };
    }
    
    if (stats.totalImpressions < 100) {
      return {
        type: 'success',
        message: 'Good start! Focus on increasing page views to boost revenue.',
        action: 'Improve content engagement'
      };
    }
    
    return {
      type: 'success',
      message: 'Ad performance is good. Consider testing new ad placements.',
      action: 'Experiment with new formats'
    };
  };

  const tip = getOptimizationTip();

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">📊 Ad Revenue Analytics</h3>
        <div className="flex space-x-2">
          {(['day', 'week', 'month'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                timeframe === period
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-700 border border-gray-600 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">
            {formatCurrency(stats.totalRevenue)}
          </div>
          <div className="text-gray-300 text-sm">Total Revenue</div>
        </div>
        
        <div className="bg-gray-700 border border-gray-600 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">
            {stats.totalImpressions.toLocaleString()}
          </div>
          <div className="text-gray-300 text-sm">Impressions</div>
        </div>
        
        <div className="bg-gray-700 border border-gray-600 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">
            {stats.ctr.toFixed(2)}%
          </div>
          <div className="text-gray-300 text-sm">Click Rate</div>
        </div>
        
        <div className="bg-gray-700 border border-gray-600 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {formatCurrency(stats.avgCpm)}
          </div>
          <div className="text-gray-300 text-sm">Avg CPM</div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-white mb-3">Performance Metrics</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-300">Blocked Rate:</span>
              <span className={`font-medium ${stats.blockedRate > 30 ? 'text-red-400' : 'text-green-400'}`}>
                {stats.blockedRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Click-through Rate:</span>
              <span className={`font-medium ${stats.ctr > 2 ? 'text-green-400' : 'text-yellow-400'}`}>
                {stats.ctr.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Revenue per Impression:</span>
              <span className="text-green-400 font-medium">
                {formatCurrency(stats.totalRevenue / Math.max(stats.totalImpressions, 1))}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-white mb-3">Revenue Breakdown</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-300">Impressions:</span>
              <span className="text-blue-400 font-medium">
                {stats.totalImpressions.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Clicks:</span>
              <span className="text-purple-400 font-medium">
                {stats.clickedImpressions.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Blocked:</span>
              <span className="text-red-400 font-medium">
                {stats.blockedImpressions.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Optimization Tip */}
      <div className={`border rounded-lg p-4 ${
        tip.type === 'warning' ? 'border-yellow-500 bg-yellow-500/10' :
        tip.type === 'info' ? 'border-blue-500 bg-blue-500/10' :
        'border-green-500 bg-green-500/10'
      }`}>
        <div className="flex items-start space-x-3">
          <div className={`text-xl ${
            tip.type === 'warning' ? 'text-yellow-400' :
            tip.type === 'info' ? 'text-blue-400' :
            'text-green-400'
          }`}>
            {tip.type === 'warning' ? '⚠️' : tip.type === 'info' ? 'ℹ️' : '✅'}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-white mb-1">{tip.action}</h4>
            <p className="text-gray-300 text-sm">{tip.message}</p>
          </div>
        </div>
      </div>

      {/* Upgrade CTA */}
      <div className="mt-6 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-lg p-4 text-center">
        <h4 className="text-lg font-semibold text-white mb-2">
          🚀 Want to Remove Ads?
        </h4>
        <p className="text-gray-300 text-sm mb-3">
          Upgrade to Pro for an ad-free experience and unlimited access to all features
        </p>
        <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
          Upgrade to Pro - $6.99/month
        </button>
      </div>
    </div>
  );
};
