import { doc, updateDoc, increment, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface CreditUsage {
  userId: string;
  amount: number;
  feature: string;
  timestamp: Date;
  success: boolean;
  metadata?: any;
}

export interface UserCredits {
  credits_total: number;
  credits_used: number;
  credits_remaining: number;
  last_updated: Date;
}

export class CreditTracker {
  private static listeners: Map<string, () => void> = new Map();

  /**
   * Check if user has enough credits for an action (client-side)
   * @param userId - The user's ID
   * @param amount - Number of credits required
   * @returns Promise<boolean> - Whether user can afford the action
   */
  static async canAffordCredits(userId: string, amount: number): Promise<boolean> {
    try {
      const response = await fetch(`/api/get-credits?userId=${userId}`);
      
      if (!response.ok) {
        console.error('Error checking credits:', response.statusText);
        return false;
      }

      const result = await response.json();
      const credits = result.credits;
      
      return credits && credits.credits_remaining >= amount;

    } catch (error) {
      console.error('Error checking credits:', error);
      return false;
    }
  }

  /**
   * Use credits for a specific action AFTER the action succeeds (client-side)
   * @param userId - The user's ID
   * @param amount - Number of credits to deduct
   * @param feature - The feature/action being used
   * @param metadata - Optional metadata about the action
   * @returns Promise<boolean> - Success status
   */
  static async useCredits(
    userId: string, 
    amount: number, 
    feature: string, 
    metadata?: any
  ): Promise<boolean> {
    try {
      // Call the API route instead of direct Firestore access
      const response = await fetch('/api/use-credits/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          amount,
          feature,
          metadata
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Error using credits:', error);
        return false;
      }

      const result = await response.json();
      console.log(`Credits used: ${amount} for ${feature} by user ${userId}`);
      
      // Trigger a refresh of credit listeners
      this.notifyListeners(userId);
      
      return result.success;

    } catch (error) {
      console.error('Error using credits:', error);
      return false;
    }
  }

  /**
   * Get current credit status for a user (client-side)
   * @param userId - The user's ID
   * @returns Promise<UserCredits | null>
   */
  static async getUserCredits(userId: string): Promise<UserCredits | null> {
    try {
      const response = await fetch(`/api/get-credits?userId=${userId}`);
      
      if (!response.ok) {
        console.error('Error getting user credits:', response.statusText);
        return null;
      }

      const result = await response.json();
      return result.credits;

    } catch (error) {
      console.error('Error getting user credits:', error);
      return null;
    }
  }

  /**
   * Refund credits to a user (client-side)
   * @param userId - The user's ID
   * @param amount - Number of credits to refund
   * @param reason - Reason for refund
   * @returns Promise<boolean> - Success status
   */
  static async refundCredits(
    userId: string, 
    amount: number, 
    reason: string
  ): Promise<boolean> {
    try {
      const response = await fetch('/api/refund-credits/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          amount,
          reason
        })
      });

      if (!response.ok) {
        console.error('Error refunding credits:', response.statusText);
        return false;
      }

      const result = await response.json();
      console.log(`Credits refunded: ${amount} for ${reason} to user ${userId}`);
      return result.success;

    } catch (error) {
      console.error('Error refunding credits:', error);
      return false;
    }
  }

  /**
   * Subscribe to real-time credit updates
   * @param userId - The user's ID
   * @param callback - Callback function to handle updates
   * @returns Unsubscribe function
   */
  static subscribeToCredits(userId: string, callback: (credits: UserCredits) => void): () => void {
    if (!db) {
      console.error('Firebase db not initialized');
      return () => {};
    }

    const unsubscribe = onSnapshot(
      doc(db, 'users', userId),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const credits: UserCredits = {
            credits_total: data?.credits_total || 0,
            credits_used: data?.credits_used || 0,
            credits_remaining: data?.credits_remaining || 0,
            last_updated: data?.last_updated?.toDate() || new Date()
          };
          console.log('📊 Credit subscription update:', credits);
          callback(credits);
        }
      },
      (error) => {
        console.error('Error subscribing to credits:', error);
      }
    );

    // Store the unsubscribe function
    this.listeners.set(userId, unsubscribe);

    return () => {
      unsubscribe();
      this.listeners.delete(userId);
    };
  }

  /**
   * Notify all listeners for a specific user to refresh their data
   */
  static notifyListeners(userId: string): void {
    const listener = this.listeners.get(userId);
    if (listener) {
      // Trigger a refresh by calling the listener
      listener();
    }
  }

  /**
   * Clean up all listeners
   */
  static cleanup(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }
}

// Credit costs for different features
export const CREDIT_COSTS = {
  AI_CHAT: 1,
  OSIRION_PULL: 50,
  STATS_LOOKUP: 2,
  TOURNAMENT_STRATEGY: 5,
  POI_ANALYSIS: 10
} as const;

// Convenience functions for common actions
export const useCredits = {
  forChat: (userId: string) => CreditTracker.useCredits(userId, CREDIT_COSTS.AI_CHAT, 'ai_chat'),
  forOsirionPull: (userId: string) => CreditTracker.useCredits(userId, CREDIT_COSTS.OSIRION_PULL, 'osirion_pull'),
  forStatsLookup: (userId: string) => CreditTracker.useCredits(userId, CREDIT_COSTS.STATS_LOOKUP, 'stats_lookup'),
  forTournamentStrategy: (userId: string) => CreditTracker.useCredits(userId, CREDIT_COSTS.TOURNAMENT_STRATEGY, 'tournament_strategy'),
  forPOIAnalysis: (userId: string) => CreditTracker.useCredits(userId, CREDIT_COSTS.POI_ANALYSIS, 'poi_analysis')
};

// Convenience functions for checking if user can afford actions
export const canAffordCredits = {
  forChat: (userId: string) => CreditTracker.canAffordCredits(userId, CREDIT_COSTS.AI_CHAT),
  forOsirionPull: (userId: string) => CreditTracker.canAffordCredits(userId, CREDIT_COSTS.OSIRION_PULL),
  forStatsLookup: (userId: string) => CreditTracker.canAffordCredits(userId, CREDIT_COSTS.STATS_LOOKUP),
  forTournamentStrategy: (userId: string) => CreditTracker.canAffordCredits(userId, CREDIT_COSTS.TOURNAMENT_STRATEGY),
  forPOIAnalysis: (userId: string) => CreditTracker.canAffordCredits(userId, CREDIT_COSTS.POI_ANALYSIS)
};
