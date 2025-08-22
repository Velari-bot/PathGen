'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { doc, onSnapshot, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '@/lib/firebase';
import { 
  Subscription, 
  SubscriptionTier, 
  CheckoutSessionData, 
  UsageTrackingRequest,
  UsageTrackingResponse,
  PLAN_LIMITS 
} from '@/types/subscription';

interface SubscriptionContextType {
  subscription: Subscription | null;
  loading: boolean;
  error: string | null;
  usage: any;
  limits: any;
  createCheckoutSession: (data: CheckoutSessionData) => Promise<string>;
  cancelSubscription: () => Promise<void>;
  updatePaymentMethod: () => Promise<void>;
  trackUsage: (data: UsageTrackingRequest) => Promise<UsageTrackingResponse>;
  getCurrentUsage: () => Promise<any>;
  hasFeatureAccess: (feature: string, requiredTier: SubscriptionTier) => boolean;
  isFeatureAvailable: (feature: string) => boolean;
  getRemainingUsage: (feature: string) => { used: number; limit: number; remaining: number };
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<any>(null);
  const [limits, setLimits] = useState<any>(null);

  // Listen to subscription changes
  useEffect(() => {
    if (!user || !db) {
      setSubscription(null);
      setUsage(null);
      setLimits(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Listen to user document for subscription changes
    const unsubscribeUser = onSnapshot(
      doc(db, 'users', user.uid),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const userSubscription = data.subscription;
          const userUsage = data.usage;

          setSubscription(userSubscription || null);
          setUsage(userUsage || null);
          
          // Set limits based on subscription tier
          if (userSubscription?.tier) {
            setLimits(PLAN_LIMITS[userSubscription.tier as SubscriptionTier]);
          } else {
            setLimits(PLAN_LIMITS.free);
          }
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to subscription:', error);
        setError('Failed to load subscription data');
        setLoading(false);
      }
    );

    return () => unsubscribeUser();
  }, [user]);

  // Create checkout session
  const createCheckoutSession = useCallback(async (data: CheckoutSessionData): Promise<string> => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    try {
      setError(null);
      const functions = getFunctions();
      const createCheckout = httpsCallable(functions, 'createCheckoutSession');
      
      const result = await createCheckout(data);
      return (result.data as any).url;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create checkout session';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user]);

  // Cancel subscription (redirect to Stripe portal)
  const cancelSubscription = useCallback(async (): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    try {
      setError(null);
      const functions = getFunctions();
      const createPortalSession = httpsCallable(functions, 'createPortalSession');
      
      const result = await createPortalSession({});
      window.location.href = (result.data as any).url;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create portal session';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user]);

  // Update payment method (redirect to Stripe portal)
  const updatePaymentMethod = useCallback(async (): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    try {
      setError(null);
      const functions = getFunctions();
      const createPortalSession = httpsCallable(functions, 'createPortalSession');
      
      const result = await createPortalSession({ returnUrl: window.location.href });
      window.location.href = (result.data as any).url;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create portal session';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user]);

  // Track usage
  const trackUsage = useCallback(async (data: UsageTrackingRequest): Promise<UsageTrackingResponse> => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    try {
      setError(null);
      const functions = getFunctions();
      const trackUsageFunction = httpsCallable(functions, 'trackUsage');
      
      const result = await trackUsageFunction(data);
      return result.data as UsageTrackingResponse;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to track usage';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user]);

  // Get current usage
  const getCurrentUsage = useCallback(async (): Promise<any> => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    try {
      setError(null);
      const functions = getFunctions();
      const getCurrentUsageFunction = httpsCallable(functions, 'getCurrentUsage');
      
      const result = await getCurrentUsageFunction({});
      return result.data;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to get current usage';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user]);

  // Check if user has access to a feature
  const hasFeatureAccess = useCallback((feature: string, requiredTier: SubscriptionTier): boolean => {
    if (!subscription) return false;
    
    const tierOrder = { free: 0, standard: 1, pro: 2 };
    const userTier = subscription.tier || 'free';
    
    return tierOrder[userTier] >= tierOrder[requiredTier];
  }, [subscription]);

  // Check if a feature is available for the user's tier
  const isFeatureAvailable = useCallback((feature: string): boolean => {
    if (!subscription || !limits) return false;
    
    const featureKey = `${feature}Used` as keyof typeof usage;
    const limitKey = `monthly${feature.charAt(0).toUpperCase() + feature.slice(1)}` as keyof typeof limits;
    
    if (!usage || !limits) return false;
    
    return (usage[featureKey] || 0) < (limits[limitKey] || 0);
  }, [subscription, limits, usage]);

  // Get remaining usage for a feature
  const getRemainingUsage = useCallback((feature: string): { used: number; limit: number; remaining: number } => {
    if (!usage || !limits) {
      return { used: 0, limit: 0, remaining: 0 };
    }
    
    const featureKey = `${feature}Used` as keyof typeof usage;
    const limitKey = `monthly${feature.charAt(0).toUpperCase() + feature.slice(1)}` as keyof typeof limits;
    
    const used = usage[featureKey] || 0;
    const limit = limits[limitKey] || 0;
    const remaining = Math.max(0, limit - used);
    
    return { used, limit, remaining };
  }, [usage, limits]);

  const value: SubscriptionContextType = {
    subscription,
    loading,
    error,
    usage,
    limits,
    createCheckoutSession,
    cancelSubscription,
    updatePaymentMethod,
    trackUsage,
    getCurrentUsage,
    hasFeatureAccess,
    isFeatureAvailable,
    getRemainingUsage
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

// Hook for checking if a specific feature is available
export function useFeatureAccess(feature: string, requiredTier: SubscriptionTier = 'free') {
  const { hasFeatureAccess, isFeatureAvailable, loading } = useSubscription();
  
  return {
    hasAccess: hasFeatureAccess(feature, requiredTier),
    isAvailable: isFeatureAvailable(feature),
    loading
  };
}

// Hook for getting usage information
export function useUsage(feature: string) {
  const { getRemainingUsage, usage, limits, loading } = useSubscription();
  
  return {
    ...getRemainingUsage(feature),
    usage,
    limits,
    loading
  };
}
