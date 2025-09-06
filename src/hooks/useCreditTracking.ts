'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CreditTracker, UserCredits, useCredits, CREDIT_COSTS } from '@/lib/credit-tracker';

export interface CreditTrackingState {
  credits: UserCredits | null;
  isLoading: boolean;
  error: string | null;
  useCredits: (amount: number, feature: string, metadata?: any) => Promise<boolean>;
  deductCreditsAfterAction: (amount: number, feature: string, metadata?: any) => Promise<boolean>;
  useCreditsForChat: () => Promise<boolean>;
  useCreditsForReplayUpload: () => Promise<boolean>;
  useCreditsForOsirionPull: () => Promise<boolean>;
  useCreditsForStatsLookup: () => Promise<boolean>;
  useCreditsForTournamentStrategy: () => Promise<boolean>;
  useCreditsForPOIAnalysis: () => Promise<boolean>;
  canAfford: (amount: number) => boolean;
  refreshCredits: () => Promise<void>;
}

export function useCreditTracking(): CreditTrackingState {
  const { user } = useAuth();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial credits
  const loadCredits = useCallback(async () => {
    if (!user?.uid) {
      setCredits(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const userCredits = await CreditTracker.getUserCredits(user.uid);
      setCredits(userCredits);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load credits');
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user?.uid) {
      setCredits(null);
      return;
    }

    const unsubscribe = CreditTracker.subscribeToCredits(user.uid, (updatedCredits) => {
      setCredits(updatedCredits);
      setError(null);
    });

    return () => {
      unsubscribe();
    };
  }, [user?.uid]);

  // Load credits on mount and when user changes
  useEffect(() => {
    loadCredits();
  }, [loadCredits]);

  // Generic credit usage function - now checks affordability first, then uses credits after action
  const useCreditsGeneric = useCallback(async (
    amount: number, 
    feature: string, 
    metadata?: any
  ): Promise<boolean> => {
    if (!user?.uid) {
      setError('User not authenticated');
      return false;
    }

    // Check if user can afford the action
    const canAfford = await CreditTracker.canAffordCredits(user.uid, amount);
    if (!canAfford) {
      setError('Insufficient credits');
      return false;
    }

    // Return true to allow the action to proceed
    // Credits will be deducted AFTER the action succeeds
    return true;
  }, [user?.uid]);

  // Function to deduct credits after action succeeds
  const deductCreditsAfterAction = useCallback(async (
    amount: number, 
    feature: string, 
    metadata?: any
  ): Promise<boolean> => {
    if (!user?.uid) {
      return false;
    }

    try {
      const success = await CreditTracker.useCredits(user.uid, amount, feature, metadata);
      if (!success) {
        setError('Failed to deduct credits');
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deduct credits');
      return false;
    }
  }, [user?.uid]);

  // Convenience functions for specific features
  const useCreditsForChat = useCallback(async (): Promise<boolean> => {
    return useCreditsGeneric(CREDIT_COSTS.AI_CHAT, 'ai_chat');
  }, [useCreditsGeneric]);

  const useCreditsForReplayUpload = useCallback(async (): Promise<boolean> => {
    return useCreditsGeneric(CREDIT_COSTS.REPLAY_UPLOAD, 'replay_upload');
  }, [useCreditsGeneric]);

  const useCreditsForOsirionPull = useCallback(async (): Promise<boolean> => {
    return useCreditsGeneric(CREDIT_COSTS.OSIRION_PULL, 'osirion_pull');
  }, [useCreditsGeneric]);

  const useCreditsForStatsLookup = useCallback(async (): Promise<boolean> => {
    return useCreditsGeneric(CREDIT_COSTS.STATS_LOOKUP, 'stats_lookup');
  }, [useCreditsGeneric]);

  const useCreditsForTournamentStrategy = useCallback(async (): Promise<boolean> => {
    return useCreditsGeneric(CREDIT_COSTS.TOURNAMENT_STRATEGY, 'tournament_strategy');
  }, [useCreditsGeneric]);

  const useCreditsForPOIAnalysis = useCallback(async (): Promise<boolean> => {
    return useCreditsGeneric(CREDIT_COSTS.POI_ANALYSIS, 'poi_analysis');
  }, [useCreditsGeneric]);

  // Check if user can afford an action
  const canAfford = useCallback((amount: number): boolean => {
    return credits ? credits.credits_remaining >= amount : false;
  }, [credits]);

  // Refresh credits manually
  const refreshCredits = useCallback(async (): Promise<void> => {
    await loadCredits();
  }, [loadCredits]);

  return {
    credits,
    isLoading,
    error,
    useCredits: useCreditsGeneric,
    deductCreditsAfterAction,
    useCreditsForChat,
    useCreditsForReplayUpload,
    useCreditsForOsirionPull,
    useCreditsForStatsLookup,
    useCreditsForTournamentStrategy,
    useCreditsForPOIAnalysis,
    canAfford,
    refreshCredits
  };
}

// Hook for components that only need to display credits (no usage)
export function useCreditsDisplay(): {
  credits: UserCredits | null;
  isLoading: boolean;
  error: string | null;
  refreshCredits: () => Promise<void>;
} {
  const { user } = useAuth();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCredits = useCallback(async () => {
    if (!user?.uid) {
      setCredits(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const userCredits = await CreditTracker.getUserCredits(user.uid);
      setCredits(userCredits);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load credits');
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) {
      setCredits(null);
      return;
    }

    const unsubscribe = CreditTracker.subscribeToCredits(user.uid, (updatedCredits) => {
      console.log('🔄 Credit display updated:', updatedCredits);
      setCredits(updatedCredits);
      setError(null);
    });

    return () => {
      unsubscribe();
    };
  }, [user?.uid]);

  useEffect(() => {
    loadCredits();
  }, [loadCredits]);

  return {
    credits,
    isLoading,
    error,
    refreshCredits: loadCredits
  };
}
