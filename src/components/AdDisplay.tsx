'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface AdDisplayProps {
  adType: 'banner' | 'sidebar' | 'interstitial' | 'native';
  placement: 'top' | 'bottom' | 'sidebar' | 'content';
  className?: string;
}

export const AdDisplay: React.FC<AdDisplayProps> = ({ 
  adType, 
  placement, 
  className = '' 
}) => {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const subscriptionTier = subscription?.tier || 'free';
  const [adBlocked, setAdBlocked] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  // Don't show ads for paid users
      if (subscriptionTier === 'pro') {
    return null;
  }

  useEffect(() => {
    // Check if ads are blocked
    checkAdBlock();
    
    // Load appropriate ad based on type
    loadAd();
  }, [adType, placement]);

  const checkAdBlock = () => {
    // Simple ad block detection
    const testAd = document.createElement('div');
    testAd.innerHTML = '&nbsp;';
    testAd.className = 'adsbox';
    document.body.appendChild(testAd);
    
    setTimeout(() => {
      const isBlocked = testAd.offsetHeight === 0;
      setAdBlocked(isBlocked);
      document.body.removeChild(testAd);
    }, 100);
  };

  const loadAd = () => {
    try {
      // Google AdSense integration
      if (window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setAdLoaded(true);
      } else {
        // Fallback to manual ad loading
        loadFallbackAd();
      }
    } catch (error) {
      console.warn('Ad loading failed:', error);
      setAdError(true);
    }
  };

  const loadFallbackAd = () => {
    // Fallback ad content for when AdSense fails
    setAdLoaded(true);
  };

  const getAdContent = () => {
    if (adBlocked) {
      return null; // Don't show ad blocker notifications
    }

    if (adError) {
      return (
        <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-4 text-center">
          <p className="text-gray-400 text-sm">📺 Ad Loading Failed</p>
          <p className="text-gray-300 text-xs">Please refresh the page</p>
        </div>
      );
    }

    switch (adType) {
      case 'banner':
        return (
          <div className="w-full h-[90px] bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <p className="text-blue-300 text-sm font-medium">🎮 PathGen AI</p>
              <p className="text-blue-200 text-xs">Upgrade to Pro for Ad-Free Experience</p>
              <button className="mt-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors">
                Upgrade Now
              </button>
            </div>
          </div>
        );
      
      case 'sidebar':
        return (
          <div className="w-full h-[250px] bg-gradient-to-b from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <p className="text-green-300 text-sm font-medium">🚀 Premium Features</p>
              <p className="text-green-200 text-xs mb-2">Unlimited AI Coaching</p>
              <button className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors">
                Get Pro Access
              </button>
            </div>
          </div>
        );
      
      case 'interstitial':
        return (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-md mx-4 text-center">
              <h3 className="text-white text-lg font-bold mb-3">🎯 Upgrade to Pro!</h3>
              <p className="text-gray-300 text-sm mb-4">
                Remove all ads and get unlimited access to PathGen AI features
              </p>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors">
                  Upgrade Now - $6.99/month
                </button>
                <button 
                  onClick={() => setAdLoaded(false)}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  Continue with Ads
                </button>
              </div>
            </div>
          </div>
        );
      
      case 'native':
        return (
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">🎮</span>
              </div>
              <div className="flex-1">
                <h4 className="text-purple-300 text-sm font-medium">Pro Gaming Insights</h4>
                <p className="text-purple-200 text-xs">Get unlimited AI coaching and advanced analytics</p>
              </div>
              <button className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors">
                Learn More
              </button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (!adLoaded) {
    return null;
  }

  return (
    <div className={`ad-display ad-${adType} ad-${placement} ${className}`}>
      {getAdContent()}
    </div>
  );
};

// Ad placement components for easy use
export const TopBannerAd = () => (
  <AdDisplay adType="banner" placement="top" className="mb-4" />
);

export const SidebarAd = () => (
  <AdDisplay adType="sidebar" placement="sidebar" className="mb-6" />
);

export const ContentAd = () => (
  <AdDisplay adType="native" placement="content" className="my-6" />
);

export const BottomBannerAd = () => (
  <AdDisplay adType="banner" placement="bottom" className="mt-4" />
);

export const InterstitialAd = () => (
  <AdDisplay adType="interstitial" placement="content" />
);
