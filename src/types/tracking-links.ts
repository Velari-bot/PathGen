/**
 * Simple Link Tracking System for PathGen
 */

export interface TrackingLink {
  id: string;
  name: string; // Custom name like "YouTube Campaign", "Twitter Ads", etc.
  code: string; // Short code like "YT2024", "TWITTER", "DISCORD"
  url: string; // Full tracking URL
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Stats
  totalClicks: number;
  totalSignups: number;
  totalPaidSubscriptions: number;
  totalRevenue: number; // In cents
  conversionRate: number; // signups / clicks
  paidConversionRate: number; // paid subs / clicks
}

export interface TrackingEvent {
  id: string;
  linkId: string;
  linkCode: string;
  eventType: 'click' | 'signup' | 'paid_subscription';
  userId?: string;
  sessionId?: string;
  amount?: number; // For paid subscriptions (in cents)
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    referrer?: string;
    subscriptionId?: string;
    customerId?: string;
  };
  timestamp: Date;
}

export interface LinkStats {
  linkId: string;
  linkName: string;
  linkCode: string;
  period: 'daily' | 'weekly' | 'monthly' | 'all_time';
  startDate: string;
  endDate: string;
  clicks: number;
  signups: number;
  paidSubscriptions: number;
  revenue: number;
  conversionRate: number;
  paidConversionRate: number;
  averageRevenuePerUser: number;
}
