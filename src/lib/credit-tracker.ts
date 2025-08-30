import { CreditSystem, CREDIT_COSTS, UserCredits } from './credit-system';

export interface CreditTransaction {
  id: string;
  userId: string;
  feature: string;
  cost: number;
  description: string;
  timestamp: Date;
  success: boolean;
  remainingCredits: number;
  metadata?: any;
}

export interface CreditUsage {
  userId: string;
  totalSpent: number;
  featureBreakdown: Record<string, number>;
  lastUsed: Date;
  averageDailyUsage: number;
}

export class CreditTracker {
  private static instance: CreditTracker;
  private transactions: CreditTransaction[] = [];
  private userCredits: Map<string, UserCredits> = new Map();

  private constructor() {}

  static getInstance(): CreditTracker {
    if (!CreditTracker.instance) {
      CreditTracker.instance = new CreditTracker();
    }
    return CreditTracker.instance;
  }

  // Initialize user credits (called when user signs up or subscribes)
  async initializeUserCredits(userId: string, plan: string): Promise<UserCredits> {
    const defaultCredits = plan === 'free' ? 250 : 4000;
    
    const userCredits: UserCredits = {
      userId,
      totalCredits: defaultCredits,
      usedCredits: 0,
      availableCredits: defaultCredits,
      lastReset: new Date(),
      plan,
      expiresAt: plan === 'free' ? undefined : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };

    this.userCredits.set(userId, userCredits);
    
    // TODO: Save to database
    await this.saveUserCredits(userCredits);
    
    return userCredits;
  }

  // Check if user can afford a feature
  canAffordFeature(userId: string, feature: string): boolean {
    const userCredits = this.userCredits.get(userId);
    if (!userCredits) return false;
    
    const cost = CreditSystem.getCreditCost(feature);
    return userCredits.availableCredits >= cost;
  }

  // Use credits for a feature
  async useCredits(userId: string, feature: string, metadata?: any): Promise<{
    success: boolean;
    remainingCredits: number;
    transaction: CreditTransaction | null;
    error?: string;
  }> {
    const userCredits = this.userCredits.get(userId);
    if (!userCredits) {
      return {
        success: false,
        remainingCredits: 0,
        transaction: null,
        error: 'User credits not found'
      };
    }

    const cost = CreditSystem.getCreditCost(feature);
    if (userCredits.availableCredits < cost) {
      return {
        success: false,
        remainingCredits: userCredits.availableCredits,
        transaction: null,
        error: `Insufficient credits. Need ${cost}, have ${userCredits.availableCredits}`
      };
    }

    // Deduct credits
    userCredits.usedCredits += cost;
    userCredits.availableCredits -= cost;

    // Create transaction record
    const transaction: CreditTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      feature,
      cost,
      description: CreditSystem.getFeatureCategory(feature),
      timestamp: new Date(),
      success: true,
      remainingCredits: userCredits.availableCredits,
      metadata
    };

    this.transactions.push(transaction);
    this.userCredits.set(userId, userCredits);

    // TODO: Save to database
    await this.saveUserCredits(userCredits);
    await this.saveTransaction(transaction);

    return {
      success: true,
      remainingCredits: userCredits.availableCredits,
      transaction
    };
  }

  // Add credits (for purchases, bonuses, etc.)
  async addCredits(userId: string, amount: number, reason: string): Promise<UserCredits | null> {
    const userCredits = this.userCredits.get(userId);
    if (!userCredits) return null;

    userCredits.totalCredits += amount;
    userCredits.availableCredits += amount;

    // Create transaction record for credit addition
    const transaction: CreditTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      feature: 'credit_purchase',
      cost: -amount, // Negative cost indicates credit addition
      description: `Credits added: ${reason}`,
      timestamp: new Date(),
      success: true,
      remainingCredits: userCredits.availableCredits,
      metadata: { reason, amount }
    };

    this.transactions.push(transaction);
    this.userCredits.set(userId, userCredits);

    // TODO: Save to database
    await this.saveUserCredits(userCredits);
    await this.saveTransaction(transaction);

    return userCredits;
  }

  // Get user's current credit status
  getUserCredits(userId: string): UserCredits | null {
    return this.userCredits.get(userId) || null;
  }

  // Get credit usage statistics
  getCreditUsage(userId: string): CreditUsage | null {
    const userTransactions = this.transactions.filter(t => t.userId === userId && t.cost > 0);
    if (userTransactions.length === 0) return null;

    const totalSpent = userTransactions.reduce((sum, t) => sum + t.cost, 0);
    const featureBreakdown: Record<string, number> = {};
    
    userTransactions.forEach(t => {
      featureBreakdown[t.feature] = (featureBreakdown[t.feature] || 0) + t.cost;
    });

    const lastUsed = new Date(Math.max(...userTransactions.map(t => t.timestamp.getTime())));
    
    // Calculate average daily usage (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentTransactions = userTransactions.filter(t => t.timestamp > thirtyDaysAgo);
    const averageDailyUsage = recentTransactions.reduce((sum, t) => sum + t.cost, 0) / 30;

    return {
      userId,
      totalSpent,
      featureBreakdown,
      lastUsed,
      averageDailyUsage
    };
  }

  // Reset monthly credits (for subscription plans)
  async resetMonthlyCredits(userId: string): Promise<UserCredits | null> {
    const userCredits = this.userCredits.get(userId);
    if (!userCredits || userCredits.plan === 'free') return userCredits || null;

    userCredits.usedCredits = 0;
    userCredits.availableCredits = userCredits.totalCredits;
    userCredits.lastReset = new Date();
    userCredits.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    this.userCredits.set(userId, userCredits);
    
    // TODO: Save to database
    await this.saveUserCredits(userCredits);

    return userCredits;
  }

  // Get transaction history
  getTransactionHistory(userId: string, limit: number = 50): CreditTransaction[] {
    return this.transactions
      .filter(t => t.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Get feature usage breakdown
  getFeatureUsageBreakdown(userId: string): Record<string, { count: number; totalCost: number }> {
    const userTransactions = this.transactions.filter(t => t.userId === userId && t.cost > 0);
    const breakdown: Record<string, { count: number; totalCost: number }> = {};

    userTransactions.forEach(t => {
      if (!breakdown[t.feature]) {
        breakdown[t.feature] = { count: 0, totalCost: 0 };
      }
      breakdown[t.feature].count++;
      breakdown[t.feature].totalCost += t.cost;
    });

    return breakdown;
  }

  // Predict credit needs based on usage patterns
  predictCreditNeeds(userId: string): { daily: number; weekly: number; monthly: number } {
    const usage = this.getCreditUsage(userId);
    if (!usage) return { daily: 0, weekly: 0, monthly: 0 };

    const daily = usage.averageDailyUsage;
    const weekly = daily * 7;
    const monthly = daily * 30;

    return { daily, weekly, monthly };
  }

  // Check if user should upgrade plan
  shouldUpgradePlan(userId: string): { shouldUpgrade: boolean; reason: string; recommendedPlan: string } {
    const userCredits = this.userCredits.get(userId);
    if (!userCredits) return { shouldUpgrade: false, reason: '', recommendedPlan: '' };

    const usage = this.getCreditUsage(userId);
    if (!usage) return { shouldUpgrade: false, reason: '', recommendedPlan: '' };

    const monthlyUsage = usage.averageDailyUsage * 30;
    
    if (userCredits.plan === 'free' && monthlyUsage > 200) {
      return {
        shouldUpgrade: true,
        reason: 'High usage detected. Free plan may not be sufficient.',
        recommendedPlan: 'pro'
      };
    }

    return { shouldUpgrade: false, reason: '', recommendedPlan: '' };
  }

  // Private methods for database operations (to be implemented)
  private async saveUserCredits(userCredits: UserCredits): Promise<void> {
    // TODO: Implement database save
    console.log('Saving user credits:', userCredits);
  }

  private async saveTransaction(transaction: CreditTransaction): Promise<void> {
    // TODO: Implement database save
    console.log('Saving transaction:', transaction);
  }

  // Export data for analytics
  exportData(): { transactions: CreditTransaction[]; userCredits: UserCredits[] } {
    return {
      transactions: [...this.transactions],
      userCredits: Array.from(this.userCredits.values())
    };
  }

  // Clear data (for testing)
  clearData(): void {
    this.transactions = [];
    this.userCredits.clear();
  }
}

// Global instance
export const creditTracker = CreditTracker.getInstance();

// Helper functions for common credit operations
export const useCreditsForAI = async (userId: string, messageType: 'simple' | 'complex' | 'coaching') => {
  const feature = messageType === 'simple' ? 'ai_chat_simple' : 
                  messageType === 'complex' ? 'ai_chat_complex' : 'ai_coaching_session';
  
  return await creditTracker.useCredits(userId, feature, { messageType });
};

export const useCreditsForStats = async (userId: string, analysisType: 'basic' | 'detailed' | 'performance') => {
  const feature = analysisType === 'basic' ? 'stat_lookup_basic' : 
                  analysisType === 'detailed' ? 'stat_lookup_detailed' : 'performance_analysis';
  
  return await creditTracker.useCredits(userId, feature, { analysisType });
};

export const useCreditsForReplay = async (userId: string, action: 'upload' | 'analysis') => {
  const feature = action === 'upload' ? 'replay_upload' : 'replay_analysis';
  
  return await creditTracker.useCredits(userId, feature, { action });
};

export const useCreditsForOsirion = async (userId: string, dataType: 'basic' | 'premium') => {
  const feature = dataType === 'basic' ? 'osirion_pull_basic' : 'osirion_pull_premium';
  
  return await creditTracker.useCredits(userId, feature, { dataType });
};
