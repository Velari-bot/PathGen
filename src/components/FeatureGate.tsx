'use client';

import React from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { SubscriptionTier } from '@/types/subscription';

interface FeatureGateProps {
  children: React.ReactNode;
  requiredTier: SubscriptionTier;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
  feature?: string;
  className?: string;
}

interface UpgradePromptProps {
  requiredTier: SubscriptionTier;
  currentTier?: SubscriptionTier;
  onUpgrade?: () => void;
  className?: string;
}

// Upgrade prompt component
function UpgradePrompt({ requiredTier, currentTier, onUpgrade, className = '' }: UpgradePromptProps) {
  const getTierDisplayName = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'free': return 'Free';
      case 'pro': return 'Pro';
      default: return tier;
    }
  };

  const getTierColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'free': return 'text-gray-600';
      case 'pro': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className={`p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 text-center ${className}`}>
      <div className="mb-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {requiredTier === 'free' ? 'Feature Available' : 'Upgrade Required'}
        </h3>
        <p className="text-gray-600 mb-4">
          {requiredTier === 'free' 
            ? 'This feature is available to all users.'
            : `This feature requires a ${getTierDisplayName(requiredTier)} subscription or higher.`
          }
        </p>
        {currentTier && currentTier !== 'free' && (
          <p className="text-sm text-gray-500 mb-4">
            Your current plan: <span className={`font-medium ${getTierColor(currentTier)}`}>
              {getTierDisplayName(currentTier)}
            </span>
          </p>
        )}
      </div>
      
      {requiredTier !== 'free' && (
        <div className="space-y-3">
          <button
            onClick={onUpgrade}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Upgrade to {getTierDisplayName(requiredTier)}
          </button>
          <p className="text-xs text-gray-500">
            Cancel anytime • No setup fees
          </p>
        </div>
      )}
    </div>
  );
}

// Main feature gate component
export function FeatureGate({ 
  children, 
  requiredTier, 
  fallback, 
  showUpgradePrompt = true,
  feature,
  className = ''
}: FeatureGateProps) {
  const { subscription, loading, hasFeatureAccess, isFeatureAvailable } = useSubscription();

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  // Check if user has access to the required tier
  const hasAccess = hasFeatureAccess(feature || 'general', requiredTier);
  
  // Check if the feature is available (not at usage limit)
  const isAvailable = feature ? isFeatureAvailable(feature) : true;

  if (hasAccess && isAvailable) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showUpgradePrompt) {
    return (
      <UpgradePrompt
        requiredTier={requiredTier}
        currentTier={subscription?.tier}
        onUpgrade={() => {
          // Redirect to pricing page or open upgrade modal
          window.location.href = '/pricing';
        }}
        className={className}
      />
    );
  }

  return null;
}

// Feature gate with usage tracking
export function FeatureGateWithUsage({ 
  children, 
  requiredTier, 
  feature,
  fallback,
  showUpgradePrompt = true,
  className = '',
  onFeatureUse
}: FeatureGateProps & { onFeatureUse?: () => void }) {
  const { subscription, loading, hasFeatureAccess, isFeatureAvailable, trackUsage } = useSubscription();

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  const hasAccess = hasFeatureAccess(feature || 'general', requiredTier);
  const isAvailable = feature ? isFeatureAvailable(feature) : true;

  if (hasAccess && isAvailable) {
    // Wrap children to track usage when feature is used
    if (feature && onFeatureUse) {
      return (
        <div onClick={async () => {
          try {
            await trackUsage({ 
              feature: feature as 'message' | 'data_pull' | 'replay_upload' | 'tournament_strategy', 
              tokensUsed: 0 
            });
            onFeatureUse();
          } catch (error) {
            console.error('Failed to track usage:', error);
          }
        }}>
          {children}
        </div>
      );
    }
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showUpgradePrompt) {
    return (
      <UpgradePrompt
        requiredTier={requiredTier}
        currentTier={subscription?.tier}
        onUpgrade={() => {
          window.location.href = '/pricing';
        }}
        className={className}
      />
    );
  }

  return null;
}

// Usage indicator component
export function UsageIndicator({ feature, className = '' }: { feature: string; className?: string }) {
  const { getRemainingUsage, loading } = useSubscription();

  if (loading) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        Loading usage...
      </div>
    );
  }

  const { used, limit, remaining } = getRemainingUsage(feature);
  const percentage = limit > 0 ? Math.round((used / limit) * 100) : 0;

  const getColorClass = (percent: number) => {
    if (percent >= 90) return 'text-red-600';
    if (percent >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className={`text-sm ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-gray-600">Usage</span>
        <span className={`font-medium ${getColorClass(percentage)}`}>
          {used} / {limit}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${
            percentage >= 90 ? 'bg-red-500' : 
            percentage >= 75 ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {remaining} remaining
      </div>
    </div>
  );
}
