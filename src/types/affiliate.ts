/**
 * Affiliate System Types for PathGen
 */

import { Timestamp } from 'firebase/firestore';

export interface Affiliate {
  id: string;
  userId: string; // PathGen user who became an affiliate
  email: string;
  displayName: string;
  referralCode: string; // Unique code like 'abc123'
  totalEarnings: number; // Total earned to date
  pendingEarnings: number; // Earnings not yet paid out
  paidEarnings: number; // Already paid out
  totalReferrals: number; // Number of successful referrals
  commissionRate: number; // Default 0.15 (15%)
  status: 'active' | 'suspended' | 'pending_approval';
  paymentInfo?: {
    method: 'paypal' | 'stripe' | 'bank_transfer';
    details: string; // PayPal email, bank info, etc.
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AffiliateEarning {
  id: string;
  affiliateId: string; // Reference to affiliate
  customerId: string; // Stripe customer ID
  subscriptionId: string; // Stripe subscription ID
  orderId?: string; // Checkout session ID for tracking
  amountEarned: number; // Commission amount in cents
  originalAmount: number; // Original purchase amount in cents
  commissionRate: number; // Rate used for this earning (e.g., 0.15)
  currency: string; // 'usd'
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  payoutId?: string; // Reference to payout when paid
  metadata?: {
    productName?: string;
    planType?: string;
    customerEmail?: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AffiliatePayout {
  id: string;
  affiliateId: string;
  totalAmount: number; // Total payout amount in cents
  currency: string;
  earningsIncluded: string[]; // Array of earning IDs included in this payout
  status: 'pending' | 'processing' | 'completed' | 'failed';
  paymentMethod: 'paypal' | 'stripe' | 'bank_transfer';
  paymentDetails: {
    transactionId?: string;
    paypalEmail?: string;
    bankAccount?: string;
    notes?: string;
  };
  requestedAt: Timestamp;
  processedAt?: Timestamp;
  completedAt?: Timestamp;
}

export interface AffiliateStats {
  affiliateId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  date: string; // YYYY-MM-DD format
  clicks: number; // Referral link clicks
  conversions: number; // Successful purchases
  conversionRate: number; // conversions / clicks
  totalEarnings: number; // Earnings for this period
  averageOrderValue: number; // Average purchase amount
  topProducts: string[]; // Most referred products
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Request/Response types for API endpoints
export interface CreateCheckoutRequest {
  priceId: string;
  userId: string;
  successUrl?: string;
  cancelUrl?: string;
  referralCode?: string; // Optional affiliate referral code
}

export interface AffiliateSignupRequest {
  userId: string;
  email: string;
  displayName: string;
  paymentMethod: 'paypal' | 'stripe' | 'bank_transfer';
  paymentDetails: string;
}

export interface PayoutRequest {
  affiliateId: string;
  amount?: number; // If not provided, payout all pending earnings
  paymentMethod: 'paypal' | 'stripe' | 'bank_transfer';
}
