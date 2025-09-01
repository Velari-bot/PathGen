import { getDb } from '@/lib/firebase-admin-api';
import { SubscriptionTier, PLAN_LIMITS } from '@/types/subscription';

export interface SubscriptionUpdateData {
  userId: string;
  tier: SubscriptionTier;
  status: 'active' | 'past_due' | 'canceled' | 'unpaid';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  startDate?: Date;
  endDate?: Date;
  autoRenew?: boolean;
}

export interface SubscriptionUpdateResult {
  success: boolean;
  updatedFields: string[];
  errors: string[];
  timestamp: Date;
}

export class SubscriptionManager {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second

  /**
   * Updates subscription with comprehensive error handling and retries
   */
  static async updateSubscription(data: SubscriptionUpdateData): Promise<SubscriptionUpdateResult> {
    const result: SubscriptionUpdateResult = {
      success: false,
      updatedFields: [],
      errors: [],
      timestamp: new Date()
    };

    try {
      const db = getDb();
      const { userId, tier, status, stripeCustomerId, stripeSubscriptionId, startDate, endDate, autoRenew } = data;

      // Prepare subscription data
      const subscriptionData = {
        status,
        tier,
        plan: tier,
        startDate: startDate || new Date(),
        endDate: endDate || null,
        autoRenew: autoRenew ?? true,
        paymentMethod: null,
        stripeCustomerId: stripeCustomerId || null,
        stripeSubscriptionId: stripeSubscriptionId || null,
        updatedAt: new Date()
      };

      // Update user document with retry logic
      await this.updateWithRetry(async () => {
        await db.collection('users').doc(userId).update({
          subscription: subscriptionData,
          subscriptionStatus: status,
          subscriptionTier: tier,
          updatedAt: new Date()
        });
      });
      result.updatedFields.push('user.subscription');

      // Update or create subscription document
      await this.updateWithRetry(async () => {
        const subscriptionsSnapshot = await db.collection('subscriptions')
          .where('userId', '==', userId)
          .get();

        const fullSubscriptionData = {
          userId,
          stripeCustomerId: stripeCustomerId || 'manual',
          stripeSubscriptionId: stripeSubscriptionId || 'manual',
          plan: tier,
          status,
          currentPeriodStart: startDate || new Date(),
          currentPeriodEnd: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: false,
          trialEnd: null,
          limits: PLAN_LIMITS[tier],
          usage: {
            messagesUsed: 0,
            tokensUsed: 0,
            dataPullsUsed: 0,
            replayUploadsUsed: 0,
            tournamentStrategiesUsed: 0,
            resetDate: new Date()
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };

        if (!subscriptionsSnapshot.empty) {
          await subscriptionsSnapshot.docs[0].ref.update(fullSubscriptionData);
        } else {
          await db.collection('subscriptions').add(fullSubscriptionData);
        }
      });
      result.updatedFields.push('subscriptions');

      // Update usage document
      await this.updateWithRetry(async () => {
        const usageSnapshot = await db.collection('usage')
          .where('userId', '==', userId)
          .get();

        const usageData = {
          userId,
          subscriptionTier: tier,
          totalCredits: tier === 'pro' ? 4000 : 250,
          usedCredits: 0,
          availableCredits: tier === 'pro' ? 4000 : 250,
          lastReset: new Date(),
          updatedAt: new Date()
        };

        if (!usageSnapshot.empty) {
          await usageSnapshot.docs[0].ref.update(usageData);
        } else {
          await db.collection('usage').add(usageData);
        }
      });
      result.updatedFields.push('usage');

      // Log the update
      await this.updateWithRetry(async () => {
        await db.collection('webhookLogs').add({
          eventType: 'subscription.update',
          userId,
          plan: tier,
          status,
          timestamp: new Date(),
          success: true,
          message: `Updated user ${userId} to ${tier} subscription`,
          updatedFields: result.updatedFields
        });
      });
      result.updatedFields.push('webhookLogs');

      result.success = true;
      console.log(`✅ Successfully updated subscription for user ${userId} to ${tier}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(errorMessage);
      console.error(`❌ Failed to update subscription for user ${data.userId}:`, error);
    }

    return result;
  }

  /**
   * Updates subscription with retry logic
   */
  private static async updateWithRetry(updateFunction: () => Promise<void>): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        await updateFunction();
        return; // Success, exit retry loop
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < this.MAX_RETRIES) {
          console.log(`⚠️ Update attempt ${attempt} failed, retrying in ${this.RETRY_DELAY}ms...`);
          await this.delay(this.RETRY_DELAY * attempt); // Exponential backoff
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * Validates subscription data before update
   */
  static validateSubscriptionData(data: SubscriptionUpdateData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.userId) {
      errors.push('User ID is required');
    }

    if (!data.tier || !['free', 'pro'].includes(data.tier)) {
      errors.push('Valid tier (free or pro) is required');
    }

    if (!data.status || !['active', 'past_due', 'canceled', 'unpaid'].includes(data.status)) {
      errors.push('Valid status is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Gets current subscription status for a user
   */
  static async getSubscriptionStatus(userId: string): Promise<{
    tier: SubscriptionTier;
    status: string;
    lastUpdated: Date;
    hasActiveSubscription: boolean;
  } | null> {
    try {
      const db = getDb();
      const userDoc = await db.collection('users').doc(userId).get();

      if (!userDoc.exists) {
        return null;
      }

      const userData = userDoc.data();
      const subscription = userData?.subscription;

      return {
        tier: subscription?.tier || 'free',
        status: subscription?.status || 'free',
        lastUpdated: userData?.updatedAt?.toDate() || new Date(),
        hasActiveSubscription: subscription?.status === 'active'
      };
    } catch (error) {
      console.error(`❌ Error getting subscription status for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Ensures subscription consistency across all collections
   */
  static async ensureConsistency(userId: string): Promise<SubscriptionUpdateResult> {
    try {
      const db = getDb();
      
      // Get current subscription status
      const status = await this.getSubscriptionStatus(userId);
      if (!status) {
        throw new Error('User not found');
      }

      // Update to ensure consistency
      return await this.updateSubscription({
        userId,
        tier: status.tier,
        status: status.status as any,
        startDate: status.lastUpdated
      });

    } catch (error) {
      return {
        success: false,
        updatedFields: [],
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        timestamp: new Date()
      };
    }
  }

  /**
   * Utility function for delays
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
