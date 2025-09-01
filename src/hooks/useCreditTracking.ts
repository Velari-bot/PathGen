'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CreditSystem } from '@/lib/credit-system-client';

export function useCreditTracking() {
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);

  const trackCreditUsage = useCallback(async (
    feature: string, 
    metadata?: any
  ): Promise<{ success: boolean; availableCredits: number; sessionId?: string; error?: string }> => {
    if (!user) {
      return { success: false, availableCredits: 0, error: 'User not authenticated' };
    }

    setIsTracking(true);
    
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const response = await fetch('/api/track-credit-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          feature,
          metadata,
          sessionId
        })
      });

      const result = await response.json();

      if (!result.success) {
        return {
          success: false,
          availableCredits: result.availableCredits || 0,
          error: result.error || 'Failed to track credit usage'
        };
      }

      return {
        success: true,
        availableCredits: result.availableCredits,
        sessionId
      };

    } catch (error) {
      console.error('Error tracking credit usage:', error);
      return {
        success: false,
        availableCredits: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      setIsTracking(false);
    }
  }, [user]);

  const updateCreditResult = useCallback(async (
    feature: string,
    sessionId: string,
    success: boolean,
    finalMetadata?: any
  ): Promise<void> => {
    if (!user) return;

    try {
      await fetch('/api/update-credit-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          feature,
          sessionId,
          success,
          finalMetadata
        })
      });
    } catch (error) {
      console.error('Error updating credit result:', error);
    }
  }, [user]);

  const refundCredits = useCallback(async (
    feature: string,
    sessionId: string
  ): Promise<{ success: boolean; availableCredits: number }> => {
    if (!user) {
      return { success: false, availableCredits: 0 };
    }

    try {
      const response = await fetch('/api/refund-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          feature,
          sessionId
        })
      });

      const result = await response.json();
      return {
        success: result.success,
        availableCredits: result.availableCredits || 0
      };

    } catch (error) {
      console.error('Error refunding credits:', error);
      return { success: false, availableCredits: 0 };
    }
  }, [user]);

  const getCreditCost = useCallback((feature: string): number => {
    return CreditSystem.getCreditCost(feature);
  }, []);

  const canAffordFeature = useCallback((availableCredits: number, feature: string): boolean => {
    return CreditSystem.canAfford(availableCredits, feature);
  }, []);

  return {
    trackCreditUsage,
    updateCreditResult,
    refundCredits,
    getCreditCost,
    canAffordFeature,
    isTracking
  };
}
