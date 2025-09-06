'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCreditsDisplay } from '@/hooks/useCreditTracking';
import { CreditSystem } from '@/lib/credit-system-client';

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
  const { credits, isLoading, error } = useCreditsDisplay();

  if (!user) {
    return (
      <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
        <div className="text-center text-gray-400">
          Please log in to view your credits
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
        <div className="text-center text-gray-400">
          Loading credits...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
        <div className="text-center text-red-400">
          Error loading credits: {error}
        </div>
      </div>
    );
  }

  if (!credits) {
    return (
      <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
        <div className="text-center text-gray-400">
          No credit data available
        </div>
      </div>
    );
  }

  const usagePercentage = credits.credits_total > 0 
    ? (credits.credits_used / credits.credits_total) * 100 
    : 0;

  if (compact) {
    return (
      <div className={`bg-gray-800 rounded-lg p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-300">Credits</div>
          <div className="text-sm font-medium text-white">
            {CreditSystem.formatCredits(credits.credits_remaining)} / {CreditSystem.formatCredits(credits.credits_total)}
          </div>
        </div>
        <div className="mt-2 w-full bg-gray-700 rounded-full h-1">
          <div 
            className="h-1 rounded-full bg-white transition-all duration-300"
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">Credits</h3>
        {showPurchaseButton && (
          <button
            onClick={() => window.location.href = '/pricing'}
            className="px-3 py-1 bg-white text-gray-900 hover:bg-gray-100 rounded-lg transition-colors text-sm"
          >
            Get More
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">
            {CreditSystem.formatCredits(credits.credits_remaining)}
          </div>
          <div className="text-gray-300 text-sm">Available</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">
            {CreditSystem.formatCredits(credits.credits_used)}
          </div>
          <div className="text-gray-300 text-sm">Used</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">
            {CreditSystem.formatCredits(credits.credits_total)}
          </div>
          <div className="text-gray-300 text-sm">Total</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-300 mb-2">
          <span>Usage</span>
          <span>{usagePercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="h-2 rounded-full transition-all duration-300 bg-white"
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>
      </div>

      <div className="text-xs text-gray-400">
        Last updated: {credits.last_updated.toLocaleString()}
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
