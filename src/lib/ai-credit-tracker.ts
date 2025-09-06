import { db } from '@/lib/firebase-admin';
import { CreditUsage, UserProfile } from '@/types/ai-coaching';

export class CreditTracker {
  private static readonly CREDIT_COSTS = {
    chat: 1,
    replay_upload: 20,
    osirion_pull: 50,
    stats_lookup: 2,
    tournament_strategy: 5,
    poi_analysis: 10
  } as const;

  /**
   * Deduct credits for a specific feature
   */
  static async deductCredits(
    userId: string, 
    feature: keyof typeof CreditTracker.CREDIT_COSTS,
    metadata?: any
  ): Promise<{ success: boolean; newTotal: number; creditsRemaining: number }> {
    try {
      const userRef = db.collection('users').doc(userId);
      const userSnap = await userRef.get();
      
      if (!userSnap.exists) {
        throw new Error('User not found');
      }

      const userData = userSnap.data() as UserProfile;
      const cost = this.CREDIT_COSTS[feature];
      const currentUsed = userData.usage?.creditsUsed || 0;
      const totalCredits = userData.subscription?.tier === 'pro' ? 4000 : 250;
      
      // Check if user has enough credits
      if (currentUsed + cost > totalCredits) {
        throw new Error('Credit limit reached');
      }

      const newTotal = currentUsed + cost;
      const creditsRemaining = totalCredits - newTotal;

      // Update user document
      await userRef.update({
        'usage.creditsUsed': newTotal,
        'usage.lastUsed': new Date(),
        'usage.featuresUsed': [...(userData.usage?.featuresUsed || []), feature]
      });

      // Log credit usage
      await db.collection('creditUsage').add({
        userId,
        feature,
        cost,
        timestamp: new Date(),
        success: true,
        metadata
      });

      return {
        success: true,
        newTotal,
        creditsRemaining
      };
    } catch (error) {
      console.error('Error deducting credits:', error);
      
      // Log failed attempt
      await db.collection('creditUsage').add({
        userId,
        feature,
        cost: this.CREDIT_COSTS[feature],
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata
      });

      throw error;
    }
  }

  /**
   * Check if user can afford a feature
   */
  static async canAffordCredits(
    userId: string, 
    feature: keyof typeof CreditTracker.CREDIT_COSTS
  ): Promise<boolean> {
    try {
      const userRef = db.collection('users').doc(userId);
      const userSnap = await userRef.get();
      
      if (!userSnap.exists) {
        return false;
      }

      const userData = userSnap.data() as UserProfile;
      const cost = this.CREDIT_COSTS[feature];
      const currentUsed = userData.usage?.creditsUsed || 0;
      const totalCredits = userData.subscription?.tier === 'pro' ? 4000 : 250;
      
      return (currentUsed + cost) <= totalCredits;
    } catch (error) {
      console.error('Error checking credit affordability:', error);
      return false;
    }
  }

  /**
   * Get user's current credit status
   */
  static async getUserCredits(userId: string): Promise<{
    creditsUsed: number;
    creditsTotal: number;
    creditsRemaining: number;
    tier: 'free' | 'pro';
  }> {
    try {
      const userRef = db.collection('users').doc(userId);
      const userSnap = await userRef.get();
      
      if (!userSnap.exists) {
        throw new Error('User not found');
      }

      const userData = userSnap.data() as UserProfile;
      const creditsUsed = userData.usage?.creditsUsed || 0;
      const creditsTotal = userData.subscription?.tier === 'pro' ? 4000 : 250;
      const creditsRemaining = creditsTotal - creditsUsed;

      return {
        creditsUsed,
        creditsTotal,
        creditsRemaining,
        tier: userData.subscription?.tier || 'free'
      };
    } catch (error) {
      console.error('Error getting user credits:', error);
      throw error;
    }
  }

  /**
   * Get credit costs for all features
   */
  static getCreditCosts() {
    return this.CREDIT_COSTS;
  }
}
