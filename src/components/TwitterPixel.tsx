'use client';

import { useEffect } from 'react';

// Declare the global twq function for TypeScript
declare global {
  interface Window {
    twq: any;
  }
}

export default function TwitterPixel() {
  useEffect(() => {
    // Initialize Twitter pixel if not already loaded
    if (typeof window !== 'undefined' && !window.twq) {
      (function(e: any, t: any, n: any, s: any, u: any, a: any) {
        e.twq || (s = e.twq = function() {
          s.exe ? s.exe.apply(s, arguments) : s.queue.push(arguments);
        }, s.version = '1.1', s.queue = [], u = t.createElement(n), u.async = !0, 
        u.src = 'https://static.ads-twitter.com/uwt.js', 
        a = t.getElementsByTagName(n)[0], a.parentNode.insertBefore(u, a));
      })(window, document, 'script', undefined, undefined, undefined);
      
      // Configure the pixel with your tracking ID
      window.twq('config', 'qh99w');
      
      console.log('🐦 Twitter Pixel initialized');
    }
  }, []);

  return null; // This component doesn't render anything
}

// Utility functions for tracking events
export const trackTwitterEvent = (eventId: string, parameters: any = {}) => {
  if (typeof window !== 'undefined' && window.twq) {
    try {
      window.twq('event', eventId, parameters);
      console.log(`🐦 Twitter Event Tracked: ${eventId}`, parameters);
    } catch (error) {
      console.error('❌ Twitter tracking error:', error);
    }
  }
};

// Predefined event tracking functions for PathGen
export const trackSignup = (email?: string) => {
  trackTwitterEvent('tw-qh99w-qh99x', {
    content_type: 'signup',
    content_name: 'PathGen AI Registration',
    email_address: email || null,
    conversion_id: `signup_${Date.now()}`
  });
};

export const trackSubscription = (tier: string, value: number, currency: string = 'USD', email?: string) => {
  trackTwitterEvent('tw-qh99w-qh99x', {
    value: value,
    currency: currency,
    content_type: 'subscription',
    content_name: `PathGen ${tier} Subscription`,
    content_price: value,
    email_address: email || null,
    conversion_id: `sub_${tier}_${Date.now()}`
  });
};

export const trackPageView = (pageName: string) => {
  trackTwitterEvent('tw-qh99w-qh99x', {
    content_type: 'page_view',
    content_name: pageName,
    conversion_id: `pageview_${pageName}_${Date.now()}`
  });
};

export const trackAIInteraction = (interactionType: string) => {
  trackTwitterEvent('tw-qh99w-qh99x', {
    content_type: 'ai_interaction',
    content_name: `AI ${interactionType}`,
    conversion_id: `ai_${interactionType}_${Date.now()}`
  });
};

export const trackTournamentView = (tournamentType: string) => {
  trackTwitterEvent('tw-qh99w-qh99x', {
    content_type: 'tournament_engagement',
    content_name: `Tournament ${tournamentType}`,
    conversion_id: `tournament_${tournamentType}_${Date.now()}`
  });
};
