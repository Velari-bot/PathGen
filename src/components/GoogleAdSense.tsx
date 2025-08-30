'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { adManager } from '@/lib/ad-manager';

interface GoogleAdSenseProps {
  adSlot: string;
  adFormat: 'auto' | 'fluid' | 'rectangle' | 'banner';
  className?: string;
  style?: React.CSSProperties;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export const GoogleAdSense: React.FC<GoogleAdSenseProps> = ({
  adSlot,
  adFormat,
  className = '',
  style = {}
}) => {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const subscriptionTier = subscription?.tier || 'free';
  const adRef = useRef<HTMLDivElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adBlocked, setAdBlocked] = useState(false);

  // Don't show ads for paid users
      if (subscriptionTier === 'pro') {
    return null;
  }

  useEffect(() => {
    if (!user) return;

    // Check if AdSense is available
    if (typeof window !== 'undefined' && window.adsbygoogle) {
      loadAd();
    } else {
      // Load AdSense script if not already loaded
      loadAdSenseScript();
    }
  }, [user, subscriptionTier]);

  const loadAdSenseScript = () => {
    if (document.querySelector('script[src*="pagead2.googlesyndication.com"]')) {
      // Script already loaded
      loadAd();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    
    script.onload = () => {
      // Initialize AdSense
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      loadAd();
    };

    script.onerror = () => {
      console.warn('Failed to load Google AdSense script');
      setAdBlocked(true);
    };

    document.head.appendChild(script);
  };

  const loadAd = () => {
    try {
      if (adRef.current && window.adsbygoogle) {
        // Record impression in ad manager
        const impression = adManager.recordImpression(adSlot, user?.uid || 'anonymous', false);
        
        // Push ad to AdSense
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setAdLoaded(true);
        
        console.log(`✅ Ad loaded: ${adSlot}`, impression);
      }
    } catch (error) {
      console.warn('Ad loading failed:', error);
      setAdBlocked(true);
    }
  };

  const handleAdClick = () => {
    if (user) {
      adManager.recordClick(adSlot, user.uid);
    }
  };

  const getAdStyle = () => {
    switch (adFormat) {
      case 'auto':
        return { display: 'block', textAlign: 'center' as const };
      case 'fluid':
        return { display: 'block', height: '280px' };
      case 'rectangle':
        return { display: 'inline-block', width: '300px', height: '250px' };
      case 'banner':
        return { display: 'block', width: '100%', height: '90px' };
      default:
        return {};
    }
  };

  if (adBlocked) {
    return null; // Don't show ad blocker notifications
  }

  return (
    <div 
      ref={adRef}
      className={`google-adsense ${className}`}
      style={{ ...getAdStyle(), ...style }}
      onClick={handleAdClick}
    >
      <ins
        className="adsbygoogle"
        style={getAdStyle()}
        data-ad-client="ca-pub-2357025365884471" // Your AdSense publisher ID
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
    </div>
  );
};

// Ad counter to limit ads per page
let adCount = 0;
const MAX_ADS_PER_PAGE = 2;

const AdWrapper = ({ children, adSlot, adFormat, className }: { 
  children: React.ReactNode; 
  adSlot: string; 
  adFormat: string; 
  className?: string; 
}) => {
  if (adCount >= MAX_ADS_PER_PAGE) {
    return null; // Don't show more than 2 ads
  }
  adCount++;
  return <>{children}</>;
};

// Pre-configured ad components
export const TopBannerAd = () => (
  <AdWrapper adSlot="top_banner_728x90" adFormat="banner">
    <GoogleAdSense 
      adSlot="top_banner_728x90"
      adFormat="banner"
      className="mb-4"
    />
  </AdWrapper>
);

export const SidebarAd = () => (
  <AdWrapper adSlot="sidebar_300x250" adFormat="rectangle">
    <GoogleAdSense 
      adSlot="sidebar_300x250"
      adFormat="rectangle"
      className="mb-6"
    />
  </AdWrapper>
);

export const ContentAd = () => (
  <AdWrapper adSlot="content_300x250" adFormat="rectangle">
    <GoogleAdSense 
      adSlot="content_300x250"
      adFormat="rectangle"
      className="my-6"
    />
  </AdWrapper>
);

export const BottomBannerAd = () => (
  <AdWrapper adSlot="bottom_banner_728x90" adFormat="banner">
    <GoogleAdSense 
      adSlot="bottom_banner_728x90"
      adFormat="banner"
      className="mt-4"
    />
  </AdWrapper>
);

export const ResponsiveAd = () => (
  <AdWrapper adSlot="responsive_auto" adFormat="auto">
    <GoogleAdSense 
      adSlot="responsive_auto"
      adFormat="auto"
      className="my-4"
    />
  </AdWrapper>
);

// Reset ad count when page changes
export const resetAdCount = () => {
  adCount = 0;
};
