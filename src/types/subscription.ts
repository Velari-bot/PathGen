import { Timestamp } from 'firebase/firestore';

// Subscription Tiers
export type SubscriptionTier = 'free' | 'pro';
export type SubscriptionStatus = 'free' | 'pro' | 'past_due' | 'canceled' | 'unpaid';

// Plan Limits Interface
export interface PlanLimits {
  monthlyMessages: number;
  monthlyTokens: number;
  monthlyDataPulls: number;
  replayUploads: number;
  tournamentStrategies: number;
  prioritySupport: boolean;
  advancedAnalytics: boolean;
}

// Usage Tracking Interface
export interface UsageTracking {
  messagesUsed: number;
  tokensUsed: number;
  dataPullsUsed: number;
  replayUploadsUsed: number;
  tournamentStrategiesUsed: number;
  resetDate: Timestamp;
  lastUpdated?: Timestamp;
}

// Payment Method Interface
export interface PaymentMethod {
  last4: string;
  brand: string;
  expMonth: number;
  expYear: number;
}

// Subscription Interface
export interface Subscription {
  status: SubscriptionStatus;
  tier: SubscriptionTier;
  startDate: Timestamp;
  endDate: Timestamp | null;
  autoRenew: boolean;
  paymentMethod: PaymentMethod | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

// User Interface with Subscription
export interface UserWithSubscription {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  createdAt: Timestamp;
  lastLogin: Timestamp;
  
  // Gaming Profile
  epicId: string | null;
  discordId: string | null;
  persona: 'casual' | 'competitive' | 'streamer';
  
  // Subscription Management
  subscription: Subscription;
  
  // Usage Tracking
  usage: UsageTracking;
  
  // Settings & Preferences
  settings: {
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
      discord: boolean;
    };
    privacy: {
      profilePublic: boolean;
      statsPublic: boolean;
      allowFriendRequests: boolean;
      showOnlineStatus: boolean;
    };
    preferences: {
      theme: 'dark' | 'light';
      language: string;
      timezone: string;
      dateFormat: string;
      timeFormat: '12h' | '24h';
    };
  };
  
  // Statistics
  statistics: {
    totalSessions: number;
    totalTime: number;
    lastActivity: Timestamp;
    favoriteFeatures: string[];
    mostUsedTools: string[];
    improvementAreas: string[];
  };
}

// Firestore Subscription Document
export interface FirestoreSubscription {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  plan: SubscriptionTier;
  status: 'active' | 'past_due' | 'canceled' | 'unpaid';
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
  cancelAtPeriodEnd: boolean;
  
  // Plan Limits
  limits: PlanLimits;
  
  // Current Usage
  usage: UsageTracking;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Usage Log Interface
export interface UsageLog {
  userId: string;
  timestamp: Timestamp;
  requestType: 'message' | 'data_pull' | 'replay_upload' | 'tournament_strategy';
  tokensUsed: number;
  cost: number;
  details: {
    endpoint?: string;
    success: boolean;
    metadata: any;
  };
  subscriptionTier: string;
  remainingTokens: number;
}

// Webhook Event Interface
export interface WebhookEvent {
  stripeEventId: string;
  eventType: string;
  processed: boolean;
  processedAt: Timestamp | null;
  error: string | null;
  rawData: any;
  createdAt: Timestamp;
}

// Stripe Checkout Session Data
export interface CheckoutSessionData {
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
}

// Stripe Checkout Session Response
export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

// Usage Tracking Request
export interface UsageTrackingRequest {
  feature: 'message' | 'data_pull' | 'replay_upload' | 'tournament_strategy';
  tokensUsed?: number;
  metadata?: any;
}

// Usage Tracking Response
export interface UsageTrackingResponse {
  success: boolean;
  usageTracked: boolean;
  remainingTokens?: number;
  limitReached?: boolean;
}

// Plan Configuration
export const PLAN_LIMITS: Record<SubscriptionTier, PlanLimits> = {
  free: {
    monthlyMessages: 10,
    monthlyTokens: 1000,
    monthlyDataPulls: 5,
    replayUploads: 0,
    tournamentStrategies: 0,
    prioritySupport: false,
    advancedAnalytics: false
  },
  pro: {
    monthlyMessages: 1000,
    monthlyTokens: 100000,
    monthlyDataPulls: 500,
    replayUploads: 50,
    tournamentStrategies: 100,
    prioritySupport: true,
    advancedAnalytics: true
  }
};

// Stripe Price IDs - UPDATE THESE WITH YOUR ACTUAL STRIPE PRICE IDs
export const STRIPE_PRICE_IDS: Record<SubscriptionTier, string> = {
  free: 'free', // Free plan (no actual Stripe price needed)
  pro: 'price_1RvsvqCitWuvPenEw9TefOig' // PathGen Pro (new)
};

// Helper function to get plan from Stripe price ID
export function getPlanFromPriceId(priceId: string): SubscriptionTier {
  for (const [plan, id] of Object.entries(STRIPE_PRICE_IDS)) {
    if (id === priceId) {
      return plan as SubscriptionTier;
    }
  }
  return 'free';
}

// Helper function to get plan limits
export function getPlanLimits(plan: SubscriptionTier): PlanLimits {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}
