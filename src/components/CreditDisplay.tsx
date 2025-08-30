'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { CreditSystem, CREDIT_COSTS, UserCredits } from '@/lib/credit-system';
import { creditTracker } from '@/lib/credit-tracker';

interface CreditDisplayProps {
  className?: string;
  showPurchaseButton?: boolean;
  compact?: boolean;
}

export const CreditDisplay: React.FC<CreditDisplayProps> = ({ 
  className = '', 
  showPurchaseButton = true,
  compact = false 
}) => {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const subscriptionTier = subscription?.tier || 'free';
  const [userCredits, setUserCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserCredits();
    }
  }, [user]);

  const loadUserCredits = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // First, get the user's actual subscription tier from Firebase
      const response = await fetch('/api/check-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
        }),
      });
      
      let actualTier = 'free';
      if (response.ok) {
        const data = await response.json();
        actualTier = data.subscriptionTier || 'free';
        console.log('✅ Got actual subscription tier from API:', actualTier);
      } else {
        console.log('⚠️ API call failed, using fallback tier:', subscriptionTier);
        actualTier = subscriptionTier || 'free';
      }
      
      // Get user credits from credit tracker with the correct tier
      let userCredits = creditTracker.getUserCredits(user.uid);
      
      // If no credits found or tier changed, initialize them with the correct tier
      if (!userCredits || userCredits.plan !== actualTier) {
        userCredits = await creditTracker.initializeUserCredits(user.uid, actualTier);
      }
      
      setUserCredits(userCredits);
    } catch (error) {
      console.error('Failed to load user credits:', error);
      // Fallback to local tier
      try {
        let userCredits = creditTracker.getUserCredits(user.uid);
        if (!userCredits) {
          userCredits = await creditTracker.initializeUserCredits(user.uid, subscriptionTier || 'free');
        }
        setUserCredits(userCredits);
      } catch (fallbackError) {
        console.error('Fallback credit loading failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const getCreditPercentage = () => {
    if (!userCredits) return 0;
    return (userCredits.usedCredits / userCredits.totalCredits) * 100;
  };

  const getCreditStatus = () => {
    if (!userCredits) return 'loading';
    
    const percentage = getCreditPercentage();
    if (percentage >= 90) return 'critical';
    if (percentage >= 75) return 'warning';
    if (percentage >= 50) return 'info';
    return 'good';
  };

  const getStatusColor = () => {
    const status = getCreditStatus();
    switch (status) {
      case 'critical': return 'text-white';
      case 'warning': return 'text-gray-300';
      case 'info': return 'text-white';
      case 'good': return 'text-gray-300';
      default: return 'text-gray-400';
    }
  };

  const getStatusMessage = () => {
    const status = getCreditStatus();
    switch (status) {
      case 'critical': return 'Low credits!';
      case 'warning': return 'Credits running low';
      case 'info': return 'Credits available';
      case 'good': return 'Plenty of credits';
      default: return 'Loading...';
    }
  };

  if (loading) {
    return (
      <div className={`bg-gray-800 border border-gray-600 rounded-lg p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-600 rounded w-1/3 mb-2"></div>
          <div className="h-6 bg-gray-600 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!userCredits) {
    return null;
  }

  if (compact) {
    return (
      <div className={`bg-gray-800 border border-gray-600 rounded-lg p-3 ${className}`}>
        <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
          <span className="text-white text-lg">💎</span>
          <span className="text-white font-medium">
            {CreditSystem.formatCredits(userCredits.availableCredits)} Credits
          </span>
        </div>
          <div className={`text-sm ${getStatusColor()}`}>
            {getStatusMessage()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 border border-gray-600 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">💎 Credit Balance</h3>
        <div className="px-3 py-1 rounded-full text-sm font-medium text-white bg-white/20">
          {getStatusMessage()}
        </div>
      </div>

      {/* Credit Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">
            {CreditSystem.formatCredits(userCredits.availableCredits)}
          </div>
          <div className="text-gray-300 text-sm">Available</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">
            {CreditSystem.formatCredits(userCredits.usedCredits)}
          </div>
          <div className="text-gray-300 text-sm">Used</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">
            {CreditSystem.formatCredits(userCredits.totalCredits)}
          </div>
          <div className="text-gray-300 text-sm">Total</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-300 mb-2">
          <span>Credit Usage</span>
          <span>{getCreditPercentage().toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="h-2 rounded-full transition-all duration-300 bg-white"
            style={{ width: `${Math.min(getCreditPercentage(), 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Plan Info */}
      <div className="bg-gray-700 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-medium">Current Plan: {userCredits.plan}</div>
            <div className="text-gray-300 text-sm">
              {userCredits.plan === 'free' ? 'One-time allocation' : 'Monthly allocation'}
            </div>
          </div>
          {userCredits.expiresAt && (
            <div className="text-right">
              <div className="text-gray-300 text-sm">Resets</div>
              <div className="text-white font-medium">
                {userCredits.expiresAt.toLocaleDateString()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Credit Costs */}
      <div className="mb-4">
        <h4 className="text-white font-medium mb-3">Quick Actions (Credit Costs)</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">AI Chat</span>
            <span className="text-white">1 credit</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Stats Lookup</span>
            <span className="text-white">2 credits</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Replay Upload</span>
            <span className="text-white">20 credits</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Osirion Pull</span>
            <span className="text-white">50 credits</span>
          </div>
        </div>
      </div>


    </div>
  );
};

// Compact credit display for headers/navbars
export const CompactCreditDisplay = () => (
  <CreditDisplay compact={true} showPurchaseButton={false} />
);

// Full credit display for dashboard
export const FullCreditDisplay = () => (
  <CreditDisplay compact={false} showPurchaseButton={false} />
);
