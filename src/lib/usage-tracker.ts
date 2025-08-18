import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';

// Type assertion for db - we know it will be available at runtime
const firestoreDb = db!;

export interface UsageData {
  userId: string;
  subscriptionTier: 'free' | 'paid' | 'pro';
  
  // Osirion API usage
  osirion: {
    matchesUsed: number;
    eventTypesUsed: number;
    replayUploadsUsed: number;
    computeRequestsUsed: number;
    lastReset: Date;
  };
  
  // AI usage
  ai: {
    messagesUsed: number;
    conversationsCreated: number;
    lastReset: Date;
  };
  
  // Epic account usage
  epic: {
    lastSync: Date;
    syncCount: number;
    statsPulled: number;
  };
  
  // General usage
  totalSessions: number;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageLimits {
  osirion: {
    matchesPerMonth: number;
    eventTypesPerMatch: number;
    replayUploadsPerMonth: number;
    computeRequestsPerMonth: number;
  };
  ai: {
    messagesPerMonth: number;
    conversationsPerMonth: number;
  };
}

export class UsageTracker {
  private static COLLECTION = 'usage';
  
  /**
   * Get or create usage document for a user
   */
  static async getUserUsage(userId: string, subscriptionTier: 'free' | 'paid' | 'pro' = 'free'): Promise<UsageData> {
    try {
      const usageRef = doc(firestoreDb, this.COLLECTION, userId);
      const usageDoc = await getDoc(usageRef);
      
      if (usageDoc.exists()) {
        return usageDoc.data() as UsageData;
      }
      
      // Create new usage document
      const newUsage: UsageData = {
        userId,
        subscriptionTier,
        osirion: {
          matchesUsed: 0,
          eventTypesUsed: 0,
          replayUploadsUsed: 0,
          computeRequestsUsed: 0,
          lastReset: new Date()
        },
        ai: {
          messagesUsed: 0,
          conversationsCreated: 0,
          lastReset: new Date()
        },
        epic: {
          lastSync: new Date(),
          syncCount: 0,
          statsPulled: 0
        },
        totalSessions: 0,
        lastActivity: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await setDoc(usageRef, newUsage);
      return newUsage;
      
    } catch (error) {
      console.error('Error getting user usage:', error);
      throw error;
    }
  }
  
  /**
   * Increment usage for a specific feature
   */
  static async incrementUsage(
    userId: string, 
    feature: keyof UsageData['osirion'] | keyof UsageData['ai'] | 'totalSessions' | 'epicSync' | 'epicStats' | 'epicAccountLinked'
  ): Promise<void> {
    try {
      const usageRef = doc(firestoreDb, this.COLLECTION, userId);
      
      const updateData: any = {
        updatedAt: new Date(),
        lastActivity: new Date()
      };
      
      if (feature === 'totalSessions') {
        updateData.totalSessions = increment(1);
      } else if (feature === 'epicSync') {
        updateData['epic.syncCount'] = increment(1);
        updateData['epic.lastSync'] = new Date();
      } else if (feature === 'epicStats') {
        updateData['epic.statsPulled'] = increment(1);
      } else if (feature === 'epicAccountLinked') {
        updateData['epic.syncCount'] = increment(1);
        updateData['epic.lastSync'] = new Date();
      } else if (feature in ['matchesUsed', 'eventTypesUsed', 'replayUploadsUsed', 'computeRequestsUsed']) {
        updateData[`osirion.${feature}`] = increment(1);
      } else if (feature in ['messagesUsed', 'conversationsCreated']) {
        updateData[`ai.${feature}`] = increment(1);
      }
      
      await updateDoc(usageRef, updateData);
      
    } catch (error) {
      console.error('Error incrementing usage:', error);
      throw error;
    }
  }
  
  /**
   * Check if user can use a specific feature
   */
  static async canUseFeature(
    userId: string, 
    feature: keyof UsageLimits['osirion'] | keyof UsageLimits['ai'],
    subscriptionTier: 'free' | 'paid' | 'pro' = 'free'
  ): Promise<{ canUse: boolean; currentUsage: number; limit: number; remaining: number }> {
    try {
      const usage = await this.getUserUsage(userId, subscriptionTier);
      const limits = this.getLimitsForTier(subscriptionTier);
      
      let currentUsage = 0;
      let limit = 0;
      
      if (feature in limits.osirion) {
        const value = usage.osirion[feature as keyof UsageData['osirion']];
        currentUsage = typeof value === 'number' ? value : 0;
        const limitValue = limits.osirion[feature as keyof UsageLimits['osirion']];
        limit = typeof limitValue === 'number' ? limitValue : 0;
      } else if (feature in limits.ai) {
        const value = usage.ai[feature as keyof UsageData['ai']];
        currentUsage = typeof value === 'number' ? value : 0;
        const limitValue = limits.ai[feature as keyof UsageLimits['ai']];
        limit = typeof limitValue === 'number' ? limitValue : 0;
      }
      
      const canUse = limit === -1 || currentUsage < limit;
      const remaining = limit === -1 ? -1 : Math.max(0, limit - currentUsage);
      
      return { canUse, currentUsage, limit, remaining };
      
    } catch (error) {
      console.error('Error checking feature usage:', error);
      // Default to allowing usage if there's an error
      return { canUse: true, currentUsage: 0, limit: -1, remaining: -1 };
    }
  }
  
  /**
   * Reset monthly usage (called automatically or manually)
   */
  static async resetMonthlyUsage(userId: string): Promise<void> {
    try {
      const usageRef = doc(firestoreDb, this.COLLECTION, userId);
      
      await updateDoc(usageRef, {
        'osirion.matchesUsed': 0,
        'osirion.eventTypesUsed': 0,
        'osirion.replayUploadsUsed': 0,
        'osirion.computeRequestsUsed': 0,
        'osirion.lastReset': new Date(),
        'ai.messagesUsed': 0,
        'ai.conversationsCreated': 0,
        'ai.lastReset': new Date(),
        updatedAt: new Date()
      });
      
    } catch (error) {
      console.error('Error resetting monthly usage:', error);
      throw error;
    }
  }
  
  /**
   * Get usage limits for a specific subscription tier
   */
  static getLimitsForTier(tier: 'free' | 'paid' | 'pro'): UsageLimits {
    const limits: Record<string, UsageLimits> = {
      free: {
        osirion: {
          matchesPerMonth: 6, // 6 uploads × $0.0254 = $0.15 (matches your cost)
          eventTypesPerMatch: 1,
          replayUploadsPerMonth: 0, // No replay uploads for free tier
          computeRequestsPerMonth: 0 // No compute for free tier
        },
        ai: {
          messagesPerMonth: 45, // 45 messages × ~$0.00038 = $0.017 (matches your cost)
          conversationsPerMonth: 1 // 1 conversation to start
        }
      },
      paid: {
        osirion: {
          matchesPerMonth: 50, // 50 uploads × $0.0254 = $1.27 (matches your cost)
          eventTypesPerMatch: 3,
          replayUploadsPerMonth: 5, // 5 replay uploads
          computeRequestsPerMonth: 50 // 50 compute requests
        },
        ai: {
          messagesPerMonth: 250, // 250 messages × ~$0.00038 = $0.095 (matches your cost)
          conversationsPerMonth: 10 // 10 conversations per month
        }
      },
      pro: {
        osirion: {
          matchesPerMonth: 275, // 275 uploads × $0.0254 = $6.99 (matches your cost)
          eventTypesPerMatch: -1, // All types
          replayUploadsPerMonth: 275, // 275 replay uploads
          computeRequestsPerMonth: 275 // 275 compute requests
        },
        ai: {
          messagesPerMonth: 700, // 700 messages × ~$0.00038 = $0.266 (matches your cost)
          conversationsPerMonth: 50 // 50 conversations per month
        }
      }
    };
    
    return limits[tier] || limits.free;
  }
  
  /**
   * Get comprehensive usage summary for a user
   */
  static async getUsageSummary(userId: string, subscriptionTier?: 'free' | 'paid' | 'pro'): Promise<{
    usage: UsageData;
    limits: UsageLimits;
    canUseFeatures: Record<string, boolean>;
    remainingCredits: Record<string, number>;
  }> {
    try {
      const usage = await this.getUserUsage(userId);
      
      // Use the passed subscriptionTier if provided, otherwise use the stored one
      const currentTier = subscriptionTier || usage.subscriptionTier;
      
      // Update the usage document with the current tier if it's different
      if (currentTier !== usage.subscriptionTier) {
        usage.subscriptionTier = currentTier;
        // Update the stored usage document
        try {
                const usageRef = doc(firestoreDb, this.COLLECTION, userId);
              await updateDoc(usageRef, { subscriptionTier: currentTier, updatedAt: new Date() });
        } catch (error) {
          console.warn('Could not update usage document tier:', error);
        }
      }
      
      const limits = this.getLimitsForTier(currentTier);
      
      const canUseFeatures = {
        osirionMatches: await this.canUseFeature(userId, 'matchesPerMonth', currentTier),
        osirionReplays: await this.canUseFeature(userId, 'replayUploadsPerMonth', currentTier),
        osirionCompute: await this.canUseFeature(userId, 'computeRequestsPerMonth', currentTier),
        aiMessages: await this.canUseFeature(userId, 'messagesPerMonth', currentTier),
        aiConversations: await this.canUseFeature(userId, 'conversationsPerMonth', currentTier)
      };
      
      const remainingCredits = {
        osirionMatches: canUseFeatures.osirionMatches.remaining,
        osirionReplays: canUseFeatures.osirionReplays.remaining,
        osirionCompute: canUseFeatures.osirionCompute.remaining,
        aiMessages: canUseFeatures.aiMessages.remaining,
        aiConversations: canUseFeatures.aiConversations.remaining
      };
      
      return {
        usage,
        limits,
        canUseFeatures: {
          osirionMatches: canUseFeatures.osirionMatches.canUse,
          osirionReplays: canUseFeatures.osirionReplays.canUse,
          osirionCompute: canUseFeatures.osirionCompute.canUse,
          aiMessages: canUseFeatures.aiMessages.canUse,
          aiConversations: canUseFeatures.aiConversations.canUse
        },
        remainingCredits
      };
      
    } catch (error) {
      console.error('Error getting usage summary:', error);
      throw error;
    }
  }
}
