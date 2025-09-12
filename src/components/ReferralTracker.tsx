'use client';

import { useEffect } from 'react';

/**
 * Referral Tracker Component
 * Automatically detects and stores referral codes from URL parameters
 */
export default function ReferralTracker() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const referralCode = urlParams.get('ref');
    
    if (referralCode) {
      console.log(`🔗 Referral code detected: ${referralCode}`);
      
      // Store referral code for later use
      localStorage.setItem('pathgen_referral', referralCode.toUpperCase());
      localStorage.setItem('pathgen_referral_timestamp', Date.now().toString());
      
      // Track the click for analytics
      trackReferralClick(referralCode);
      
      // Clean up URL (optional - removes ?ref from address bar)
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      
      // Show subtle notification to user
      showReferralNotification();
    }
  }, []);

  const trackReferralClick = async (referralCode: string) => {
    try {
      await fetch('/api/affiliate/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referralCode,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          page: window.location.pathname
        })
      });
    } catch (error) {
      console.log('Failed to track referral click:', error);
      // Don't let tracking errors affect user experience
    }
  };

  const showReferralNotification = () => {
    // Optional: Show a subtle toast notification
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10B981;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      ">
        🎉 You're supporting a PathGen affiliate!
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 4 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 4000);
  };

  return null; // This component doesn't render anything
}

/**
 * Utility function to get stored referral code
 */
export function getStoredReferralCode(): string | null {
  if (typeof window === 'undefined') return null;
  
  const code = localStorage.getItem('pathgen_referral');
  const timestamp = localStorage.getItem('pathgen_referral_timestamp');
  
  // Referral codes expire after 30 days
  if (code && timestamp) {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    if (parseInt(timestamp) > thirtyDaysAgo) {
      return code;
    } else {
      // Expired - clean up
      localStorage.removeItem('pathgen_referral');
      localStorage.removeItem('pathgen_referral_timestamp');
    }
  }
  
  return null;
}
