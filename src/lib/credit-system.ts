import { getDb } from '@/lib/firebase-admin-api';

export interface CreditCost {
  feature: string;
  cost: number;
  description: string;
  category: 'ai' | 'stats' | 'replay' | 'osirion' | 'premium';
}

export interface CreditPlan {
  id: string;
  name: string;
  price: number;
  credits: number;
  billing: 'one-time' | 'monthly';
  features: string[];
  popular?: boolean;
  recommended?: boolean;
}

export interface UserCredits {
  userId: string;
  totalCredits: number;
  usedCredits: number;
  availableCredits: number;
  lastReset: Date;
  plan: string;
  expiresAt?: Date;
}

export interface CreditUsageLog {
  userId: string;
  feature: string;
  cost: number;
  timestamp: Date;
  success: boolean;
  metadata?: any;
  sessionId?: string;
}

// Credit costs for different features
export const CREDIT_COSTS: CreditCost[] = [
  // AI Features
  {
    feature: 'ai_chat_simple',
    cost: 1,
    description: 'AI Chat (simple query)',
    category: 'ai'
  },
  {
    feature: 'ai_chat_complex',
    cost: 1,
    description: 'AI Chat (complex analysis)',
    category: 'ai'
  },
  {
    feature: 'ai_coaching_session',
    cost: 1,
    description: 'AI Coaching Session',
    category: 'ai'
  },

  // Stats & Analysis
  {
    feature: 'stat_lookup_basic',
    cost: 2,
    description: 'Stat Lookup (match summary)',
    category: 'stats'
  },
  {
    feature: 'stat_lookup_detailed',
    cost: 5,
    description: 'Stat Lookup (detailed analysis)',
    category: 'stats'
  },
  {
    feature: 'performance_analysis',
    cost: 8,
    description: 'Performance Analysis',
    category: 'stats'
  },

  // Replay Features
  {
    feature: 'replay_upload',
    cost: 20,
    description: 'Replay Upload & Analysis',
    category: 'replay'
  },
  {
    feature: 'replay_analysis',
    cost: 15,
    description: 'Replay Analysis Only',
    category: 'replay'
  },

  // Osirion API
  {
    feature: 'osirion_pull_basic',
    cost: 50,
    description: 'Osirion Pull (basic stats)',
    category: 'osirion'
  },
  {
    feature: 'osirion_pull_premium',
    cost: 50,
    description: 'Osirion Pull (premium data)',
    category: 'osirion'
  },

  // Premium Features
  {
    feature: 'premium_insights',
    cost: 10,
    description: 'Premium Insights',
    category: 'premium'
  },
  {
    feature: 'multi_match_breakdown',
    cost: 15,
    description: 'Multi-match Breakdown',
    category: 'premium'
  },
  {
    feature: 'tournament_analysis',
    cost: 25,
    description: 'Tournament Analysis',
    category: 'premium'
  },
  {
    feature: 'custom_strategy',
    cost: 30,
    description: 'Custom Strategy Plan',
    category: 'premium'
  }
];

// Credit plans
export const CREDIT_PLANS: CreditPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    credits: 250,
    billing: 'one-time',
    features: [
      'AI Chat & Coaching',
      'Basic Stats Analysis',
      'Epic Account Connection',
      'Ad-supported experience',
      'Community support'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 6.99,
    credits: 4000,
    billing: 'monthly',
    features: [
      'Unlimited AI Coaching',
      'Advanced Stats Analysis',
      'Replay Uploads',
      'Osirion API Access',
      'Premium Insights',
      'Ad-free experience',
      'Priority support'
    ],
    popular: true,
    recommended: true
  }
];

// Credit packs for additional purchases
export const CREDIT_PACKS: CreditPlan[] = [
  {
    id: 'pack_1000',
    name: 'Credit Pack',
    price: 9.99,
    credits: 1000,
    billing: 'one-time',
    features: [
      '1,000 additional credits',
      'Never expires',
      'Use with any plan'
    ]
  },
  {
    id: 'pack_2500',
    name: 'Credit Pack',
    price: 19.99,
    credits: 2500,
    billing: 'one-time',
    features: [
      '2,500 additional credits',
      'Never expires',
      'Use with any plan',
      'Save 20% vs 1000 pack'
    ]
  },
  {
    id: 'pack_5000',
    name: 'Credit Pack',
    price: 34.99,
    credits: 5000,
    billing: 'one-time',
    features: [
      '5,000 additional credits',
      'Never expires',
      'Use with any plan',
      'Save 30% vs 1000 pack'
    ]
  }
];

// Credit tracking system
export class CreditTracker {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000;

  /**
   * Track credit usage immediately when action is triggered
   * This happens BEFORE the action is executed, regardless of success/failure
   */
  static async trackCreditUsage(
    userId: string, 
    feature: string, 
    metadata?: any,
    sessionId?: string
  ): Promise<{ success: boolean; availableCredits: number; error?: string }> {
    try {
      const db = getDb();
      const cost = this.getCreditCost(feature);
      
      if (cost === 0) {
        return { success: true, availableCredits: 0 };
      }

      // Get current user credits
      const userCreditsRef = db.collection('usage').where('userId', '==', userId);
      const userCreditsSnapshot = await userCreditsRef.get();

      let userCredits: any;
      let userCreditsDocRef: any;

      if (userCreditsSnapshot.empty) {
        // Create new credits document for user
        userCredits = {
          userId,
          totalCredits: 250, // Default free credits
          usedCredits: 0,
          availableCredits: 250,
          lastReset: new Date(),
          plan: 'free',
          updatedAt: new Date()
        };
        userCreditsDocRef = await db.collection('usage').add(userCredits);
      } else {
        userCreditsDocRef = userCreditsSnapshot.docs[0].ref;
        userCredits = userCreditsSnapshot.docs[0].data();
      }

      // Check if user has enough credits
      if (userCredits.availableCredits < cost) {
        return { 
          success: false, 
          availableCredits: userCredits.availableCredits,
          error: 'Insufficient credits' 
        };
      }

      // Update credits immediately
      const newUsedCredits = userCredits.usedCredits + cost;
      const newAvailableCredits = userCredits.availableCredits - cost;

      await this.updateWithRetry(async () => {
        await userCreditsDocRef.update({
          usedCredits: newUsedCredits,
          availableCredits: newAvailableCredits,
          updatedAt: new Date()
        });
      });

      // Log the credit usage
      await this.updateWithRetry(async () => {
        await db.collection('creditUsageLogs').add({
          userId,
          feature,
          cost,
          timestamp: new Date(),
          success: true, // We'll update this later if the action fails
          metadata,
          sessionId,
          availableCreditsAfter: newAvailableCredits
        });
      });

      return { 
        success: true, 
        availableCredits: newAvailableCredits 
      };

    } catch (error) {
      console.error('Error tracking credit usage:', error);
      return { 
        success: false, 
        availableCredits: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update credit usage log with final result
   * Call this after the action completes to mark success/failure
   */
  static async updateCreditUsageResult(
    userId: string,
    feature: string,
    sessionId: string,
    success: boolean,
    finalMetadata?: any
  ): Promise<void> {
    try {
      const db = getDb();
      
      // Find the credit usage log by sessionId
      const usageLogRef = db.collection('creditUsageLogs')
        .where('userId', '==', userId)
        .where('sessionId', '==', sessionId)
        .where('feature', '==', feature)
        .orderBy('timestamp', 'desc')
        .limit(1);

      const usageLogSnapshot = await usageLogRef.get();
      
      if (!usageLogSnapshot.empty) {
        const logDoc = usageLogSnapshot.docs[0];
        await logDoc.ref.update({
          success,
          finalMetadata,
          completedAt: new Date()
        });
      }

    } catch (error) {
      console.error('Error updating credit usage result:', error);
    }
  }

  /**
   * Refund credits if action fails
   * Call this if the action fails and you want to refund the credits
   */
  static async refundCredits(
    userId: string,
    feature: string,
    sessionId: string
  ): Promise<{ success: boolean; availableCredits: number }> {
    try {
      const db = getDb();
      const cost = this.getCreditCost(feature);

      // Find the credit usage log
      const usageLogRef = db.collection('creditUsageLogs')
        .where('userId', '==', userId)
        .where('sessionId', '==', sessionId)
        .where('feature', '==', feature)
        .orderBy('timestamp', 'desc')
        .limit(1);

      const usageLogSnapshot = await usageLogRef.get();
      
      if (usageLogSnapshot.empty) {
        return { success: false, availableCredits: 0 };
      }

      const logDoc = usageLogSnapshot.docs[0];
      const logData = logDoc.data();

      // Update user credits
      const userCreditsRef = db.collection('usage').where('userId', '==', userId);
      const userCreditsSnapshot = await userCreditsRef.get();

      if (!userCreditsSnapshot.empty) {
        const userCreditsDoc = userCreditsSnapshot.docs[0];
        const userCredits = userCreditsDoc.data();

        const newUsedCredits = userCredits.usedCredits - cost;
        const newAvailableCredits = userCredits.availableCredits + cost;

        await this.updateWithRetry(async () => {
          await userCreditsDoc.ref.update({
            usedCredits: newUsedCredits,
            availableCredits: newAvailableCredits,
            updatedAt: new Date()
          });
        });

        // Mark the log as refunded
        await this.updateWithRetry(async () => {
          await logDoc.ref.update({
            refunded: true,
            refundedAt: new Date(),
            availableCreditsAfter: newAvailableCredits
          });
        });

        return { 
          success: true, 
          availableCredits: newAvailableCredits 
        };
      }

      return { success: false, availableCredits: 0 };

    } catch (error) {
      console.error('Error refunding credits:', error);
      return { 
        success: false, 
        availableCredits: 0 
      };
    }
  }

  /**
   * Get current user credits
   */
  static async getUserCredits(userId: string): Promise<UserCredits | null> {
    try {
      const db = getDb();
      const userCreditsRef = db.collection('usage').where('userId', '==', userId);
      const userCreditsSnapshot = await userCreditsRef.get();

      if (userCreditsSnapshot.empty) {
        return null;
      }

      const userCredits = userCreditsSnapshot.docs[0].data();
      return {
        userId: userCredits.userId,
        totalCredits: userCredits.totalCredits,
        usedCredits: userCredits.usedCredits,
        availableCredits: userCredits.availableCredits,
        lastReset: userCredits.lastReset.toDate(),
        plan: userCredits.plan,
        expiresAt: userCredits.expiresAt?.toDate()
      };

    } catch (error) {
      console.error('Error getting user credits:', error);
      return null;
    }
  }

  /**
   * Check if user can afford a feature
   */
  static async canAffordFeature(userId: string, feature: string): Promise<boolean> {
    try {
      const userCredits = await this.getUserCredits(userId);
      if (!userCredits) return false;

      const cost = this.getCreditCost(feature);
      return userCredits.availableCredits >= cost;

    } catch (error) {
      console.error('Error checking if user can afford feature:', error);
      return false;
    }
  }

  /**
   * Get credit cost for a feature
   */
  static getCreditCost(feature: string): number {
    const cost = CREDIT_COSTS.find(c => c.feature === feature);
    return cost ? cost.cost : 0;
  }

  /**
   * Retry mechanism for database operations
   */
  private static async updateWithRetry(updateFunction: () => Promise<void>): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        await updateFunction();
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < this.MAX_RETRIES) {
          console.log(`⚠️ Credit update attempt ${attempt} failed, retrying in ${this.RETRY_DELAY}ms...`);
          await this.delay(this.RETRY_DELAY * attempt);
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * Utility function for delays
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Credit system utilities
export class CreditSystem {
  static getCreditCost(feature: string): number {
    const cost = CREDIT_COSTS.find(c => c.feature === feature);
    return cost ? cost.cost : 0;
  }

  static canAfford(userCredits: number, feature: string): boolean {
    const cost = this.getCreditCost(feature);
    return userCredits >= cost;
  }

  static calculateRemainingCredits(userCredits: UserCredits, feature: string): number {
    const cost = this.getCreditCost(feature);
    return userCredits.availableCredits - cost;
  }

  static getFeatureCategory(feature: string): string {
    const cost = CREDIT_COSTS.find(c => c.feature === feature);
    return cost ? cost.category : 'unknown';
  }

  static getTotalCostForFeatures(features: string[]): number {
    return features.reduce((total, feature) => {
      return total + this.getCreditCost(feature);
    }, 0);
  }

  static getRecommendedPlan(monthlyUsage: number): CreditPlan {
    if (monthlyUsage <= 250) {
      return CREDIT_PLANS[0]; // Free
    } else {
      return CREDIT_PLANS[1]; // Pro
    }
  }

  static formatCredits(credits: number): string {
    if (credits >= 1000) {
      const kValue = credits / 1000;
      // Show more precision for values close to whole numbers
      if (kValue >= 9.9) {
        return `${kValue.toFixed(1)}k`;
      } else {
        return `${kValue.toFixed(3)}k`;
      }
    }
    return credits.toString();
  }

  static getPlanValue(plan: CreditPlan): number {
    // Calculate value per dollar
    if (plan.price === 0) return 0;
    return plan.credits / plan.price;
  }

  static getBestValuePlan(): CreditPlan {
    return CREDIT_PLANS.reduce((best, current) => {
      const bestValue = this.getPlanValue(best);
      const currentValue = this.getPlanValue(current);
      return currentValue > bestValue ? current : best;
    });
  }
}

// Default credit allocation for new users
export const DEFAULT_CREDITS = {
  free: 250,
  pro: 4000
};

// Credit expiration rules
export const CREDIT_EXPIRATION = {
  free: 'never', // Free credits never expire
  pro: 'monthly', // Pro credits reset monthly
  packs: 'never' // Credit pack credits never expire
};
