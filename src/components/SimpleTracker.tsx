'use client';

import { useEffect } from 'react';

/**
 * Simple Link Tracker for PathGen
 * Tracks clicks from custom tracking links like ?track=YOUTUBE
 */
export default function SimpleTracker() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const trackingCode = urlParams.get('track');
    
    if (trackingCode) {
      console.log(`📊 Tracking code detected: ${trackingCode}`);
      
      // Store tracking code for later use
      localStorage.setItem('pathgen_tracking_code', trackingCode.toUpperCase());
      localStorage.setItem('pathgen_tracking_timestamp', Date.now().toString());
      
      // Track the click immediately
      trackEvent('click', trackingCode);
      
      // Clean up URL (removes ?track from address bar)
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
      
      // Show tracking notification
      showTrackingNotification(trackingCode);
    }
  }, []);

  const trackEvent = async (eventType: string, trackingCode: string, additionalData?: any) => {
    try {
      await fetch('/api/track-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingCode,
          eventType,
          sessionId: getSessionId(),
          metadata: {
            page: window.location.pathname,
            timestamp: new Date().toISOString(),
            ...additionalData
          }
        })
      });
      
      console.log(`✅ Tracked: ${eventType} for ${trackingCode}`);
    } catch (error) {
      console.log('Failed to track event:', error);
      // Don't let tracking errors affect user experience
    }
  };

  const getSessionId = () => {
    let sessionId = sessionStorage.getItem('pathgen_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('pathgen_session_id', sessionId);
    }
    return sessionId;
  };

  const showTrackingNotification = (trackingCode: string) => {
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #3B82F6;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        max-width: 300px;
      ">
        📊 Tracking: ${trackingCode}
        <div style="font-size: 12px; opacity: 0.9; margin-top: 4px;">
          Your visit is being tracked for analytics
        </div>
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

  return null; // This component doesn't render anything visible
}

/**
 * Utility function to get stored tracking code
 */
export function getStoredTrackingCode(): string | null {
  if (typeof window === 'undefined') return null;
  
  const code = localStorage.getItem('pathgen_tracking_code');
  const timestamp = localStorage.getItem('pathgen_tracking_timestamp');
  
  // Tracking codes expire after 30 days
  if (code && timestamp) {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    if (parseInt(timestamp) > thirtyDaysAgo) {
      return code;
    } else {
      // Expired - clean up
      localStorage.removeItem('pathgen_tracking_code');
      localStorage.removeItem('pathgen_tracking_timestamp');
    }
  }
  
  return null;
}

/**
 * Function to track signup events
 */
export async function trackSignup(userId?: string) {
  const trackingCode = getStoredTrackingCode();
  if (!trackingCode) return;

  try {
    await fetch('/api/track-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trackingCode,
        eventType: 'signup',
        userId,
        sessionId: sessionStorage.getItem('pathgen_session_id'),
        metadata: {
          signupTime: new Date().toISOString()
        }
      })
    });
    
    console.log(`✅ Tracked signup for: ${trackingCode}`);
  } catch (error) {
    console.log('Failed to track signup:', error);
  }
}

/**
 * Function to track paid subscription events
 */
export async function trackPaidSubscription(userId: string, amount: number, subscriptionId: string) {
  const trackingCode = getStoredTrackingCode();
  if (!trackingCode) return;

  try {
    await fetch('/api/track-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trackingCode,
        eventType: 'paid_subscription',
        userId,
        amount, // Amount in cents
        sessionId: sessionStorage.getItem('pathgen_session_id'),
        metadata: {
          subscriptionId,
          subscriptionTime: new Date().toISOString()
        }
      })
    });
    
    console.log(`✅ Tracked paid subscription for: ${trackingCode} - $${amount/100}`);
  } catch (error) {
    console.log('Failed to track paid subscription:', error);
  }
}
