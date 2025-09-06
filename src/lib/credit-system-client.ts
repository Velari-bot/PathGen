// Client-safe credit system (no Firebase Admin imports)
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

// Client-side credit system utilities
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

  static formatCredits(credits: number | undefined): string {
    if (credits === undefined || credits === null) {
      return '0';
    }
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
