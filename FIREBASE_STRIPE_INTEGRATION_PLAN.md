# 🚀 Firebase + Stripe Integration System Workflow & Implementation Plan
## PathGen SaaS Application

---

## 📋 Table of Contents
1. [System Architecture Overview](#system-architecture-overview)
2. [Firebase vs Stripe Responsibilities](#firebase-vs-stripe-responsibilities)
3. [Connection Architecture](#connection-architecture)
4. [User Action Flows](#user-action-flows)
5. [Firestore Database Schema](#firestore-database-schema)
6. [Cloud Function Implementation](#cloud-function-implementation)
7. [Frontend Integration](#frontend-integration)
8. [Security & Best Practices](#security--best-practices)
9. [Implementation Checklist](#implementation-checklist)

---

## 🏗️ System Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Firebase      │    │     Stripe      │
│   (Next.js)     │◄──►│   Backend      │◄──►│   Billing      │
│                 │    │                 │    │                 │
│ • User Auth     │    │ • Auth          │    │ • Subscriptions │
│ • Feature Access│    │ • Firestore     │    │ • Payments      │
│ • UI Controls   │    │ • Cloud Funcs   │    │ • Webhooks      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🔄 Firebase vs Stripe Responsibilities

### 🔥 **Firebase Handles:**

| Component | Responsibility | Details |
|-----------|----------------|---------|
| **Authentication** | User sign-up, sign-in, user roles | Email/password, Google OAuth, user session management |
| **Database (Firestore)** | User profiles, subscription tier, credits usage | Real-time data storage, user state management |
| **Cloud Functions** | Serverless backend logic, webhook listeners | Business logic, API endpoints, Stripe webhook processing |
| **Authorization Logic** | Feature access control | Subscription-based feature gating, usage limits |

### 💳 **Stripe Handles:**

| Component | Responsibility | Details |
|-----------|----------------|---------|
| **Subscription Billing** | Free, Standard, Pro tiers | Recurring billing, plan management, pricing |
| **Payments** | Checkout sessions, recurring billing, failed payments | Payment processing, card management, retry logic |
| **Invoices & Payment Methods** | Billing history, payment methods | Customer billing records, payment method storage |
| **Webhooks** | Billing events | Real-time notifications for subscription changes |

---

## 🔗 Connection Architecture

### **How Firebase and Stripe Connect:**

```
Stripe Webhook → Firebase Cloud Function → Firestore Update → App State Change
     ↓                    ↓                    ↓              ↓
subscription.created → processWebhook() → updateUserTier() → enableFeatures()
```

**Key Connection Points:**
1. **Stripe → Firebase:** Webhooks for real-time billing events
2. **Firebase → Stripe:** Cloud Functions create checkout sessions
3. **Firebase → App:** Firestore subscription data determines feature access
4. **App → Firebase:** Usage tracking and subscription management

---

## 🚀 User Action Flows

### **1. User Signs Up**
```
User Action → Stripe's Role → Firebase's Role → Final Result
Sign Up     → None         → Create account → Free tier active
            →              → Set default tier → Basic features unlocked
```

**Implementation Flow:**
1. User submits signup form
2. Firebase Auth creates user account
3. Firestore creates user document with `subscription.tier: 'free'`
4. User gets access to free tier features
5. Usage tracking initialized

### **2. User Upgrades Plan**
```
User Action → Stripe's Role → Firebase's Role → Final Result
Upgrade     → Create checkout → Generate session → Redirect to Stripe
            → Process payment → Update user tier → Pro features unlocked
            → Send webhook    → Sync subscription → Real-time access update
```

**Implementation Flow:**
1. User clicks upgrade button
2. Firebase Function creates Stripe Checkout session
3. User redirected to Stripe payment page
4. Stripe processes payment and sends webhook
5. Firebase Function processes webhook and updates Firestore
6. App immediately reflects new subscription tier

### **3. User Cancels Subscription**
```
User Action → Stripe's Role → Firebase's Role → Final Result
Cancel      → Mark canceled  → Update status → Features disabled
            → Send webhook   → Set end date → Grace period active
            → Process refund → Log change   → User notified
```

**Implementation Flow:**
1. User cancels in Stripe dashboard or app
2. Stripe marks subscription as canceled
3. Stripe sends `customer.subscription.updated` webhook
4. Firebase Function updates subscription status
5. App shows cancellation notice and grace period
6. Features remain active until period end

### **4. Payment Fails**
```
User Action → Stripe's Role → Firebase's Role → Final Result
Payment     → Mark failed    → Update status → Features limited
Fails       → Send webhook   → Set past_due → Retry notifications
            → Retry logic    → Log failure   → User prompted to update
```

**Implementation Flow:**
1. Stripe payment attempt fails
2. Stripe sends `invoice.payment_failed` webhook
3. Firebase Function updates subscription status to `past_due`
4. App shows payment failure notice
5. User prompted to update payment method
6. Features remain active during grace period

### **5. User Renews Subscription**
```
User Action → Stripe's Role → Firebase's Role → Final Result
Renew       → Process payment → Update status → Pro features active
            → Send webhook    → Sync data    → Usage reset
            → Generate invoice→ Log renewal  → User confirmed
```

**Implementation Flow:**
1. Stripe processes renewal payment
2. Stripe sends `invoice.payment_succeeded` webhook
3. Firebase Function updates subscription status to `active`
4. Usage counters reset for new period
5. App confirms successful renewal
6. All features remain accessible

---

## 🗄️ Firestore Database Schema

### **Users Collection**
```typescript
users/{uid}
{
  // Basic Info
  uid: string,
  email: string,
  displayName: string,
  photoURL: string | null,
  createdAt: Timestamp,
  lastLogin: Timestamp,
  
  // Gaming Profile
  epicId: string | null,
  discordId: string | null,
  persona: 'casual' | 'competitive' | 'streamer',
  
  // Subscription Management
  subscription: {
    status: 'free' | 'standard' | 'pro' | 'past_due' | 'canceled',
    tier: 'free' | 'standard' | 'pro',
    startDate: Timestamp,
    endDate: Timestamp | null,
    autoRenew: boolean,
    stripeCustomerId: string | null,
    stripeSubscriptionId: string | null,
    paymentMethod: {
      last4: string,
      brand: string,
      expMonth: number,
      expYear: number
    } | null
  },
  
  // Usage Tracking
  usage: {
    messagesUsed: number,
    tokensUsed: number,
    dataPullsUsed: number,
    replayUploadsUsed: number,
    tournamentStrategiesUsed: number,
    resetDate: Timestamp
  },
  
  // Settings & Preferences
  settings: {
    notifications: {
      email: boolean,
      push: boolean,
      sms: boolean,
      discord: boolean
    },
    privacy: {
      profilePublic: boolean,
      statsPublic: boolean,
      allowFriendRequests: boolean,
      showOnlineStatus: boolean
    }
  }
}
```

### **Subscriptions Collection**
```typescript
subscriptions/{subscriptionId}
{
  userId: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  plan: 'free' | 'standard' | 'pro',
  status: 'active' | 'past_due' | 'canceled' | 'unpaid',
  currentPeriodStart: Timestamp,
  currentPeriodEnd: Timestamp,
  cancelAtPeriodEnd: boolean,
  
  // Plan Limits
  limits: {
    monthlyMessages: number,
    monthlyTokens: number,
    monthlyDataPulls: number,
    replayUploads: number,
    tournamentStrategies: number,
    prioritySupport: boolean,
    advancedAnalytics: boolean
  },
  
  // Current Usage
  usage: {
    messagesUsed: number,
    tokensUsed: number,
    dataPullsUsed: number,
    replayUploadsUsed: number,
    tournamentStrategiesUsed: number,
    resetDate: Timestamp
  },
  
  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### **Usage Logs Collection**
```typescript
usageLogs/{logId}
{
  userId: string,
  timestamp: Timestamp,
  requestType: 'message' | 'data_pull' | 'replay_upload' | 'tournament_strategy',
  tokensUsed: number,
  cost: number,
  details: {
    endpoint?: string,
    success: boolean,
    metadata: any
  },
  subscriptionTier: string,
  remainingTokens: number
}
```

### **Webhook Events Collection**
```typescript
webhookEvents/{eventId}
{
  stripeEventId: string,
  eventType: string,
  processed: boolean,
  processedAt: Timestamp | null,
  error: string | null,
  rawData: any,
  createdAt: Timestamp
}
```

---

## ⚡ Cloud Function Implementation

### **1. Stripe Webhook Handler (Enhanced)**
```typescript
// functions/src/stripe-webhooks.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: '2023-10-16'
});

const db = admin.firestore();

export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = functions.config().stripe.webhook_secret;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Log webhook event
  await logWebhookEvent(event);

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object as Stripe.Subscription);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true, processed: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    await markWebhookEventFailed(event.id, error.message);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customer = await stripe.customers.retrieve(subscription.customer as string);
  const userId = customer.metadata.userId;
  
  if (!userId) {
    throw new Error('No userId found in customer metadata');
  }

  const plan = getPlanFromPriceId(subscription.items.data[0].price.id);
  const limits = getPlanLimits(plan);

  // Create subscription document
  await db.collection('subscriptions').doc(subscription.id).set({
    userId,
    stripeCustomerId: subscription.customer,
    stripeSubscriptionId: subscription.id,
    plan,
    status: subscription.status,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    limits,
    usage: {
      messagesUsed: 0,
      tokensUsed: 0,
      dataPullsUsed: 0,
      replayUploadsUsed: 0,
      tournamentStrategiesUsed: 0,
      resetDate: new Date()
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // Update user profile
  await db.collection('users').doc(userId).update({
    'subscription.status': plan,
    'subscription.tier': plan,
    'subscription.stripeCustomerId': subscription.customer,
    'subscription.stripeSubscriptionId': subscription.id,
    'subscription.startDate': admin.firestore.FieldValue.serverTimestamp()
  });

  // Send welcome email for paid plans
  if (plan !== 'free') {
    await sendWelcomeEmail(userId, plan);
  }
}
```

### **2. Create Checkout Session Function**
```typescript
// functions/src/create-checkout.ts
export const createCheckoutSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const { priceId, successUrl, cancelUrl } = data;

  try {
    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();
    const customerId = userData.subscription?.stripeCustomerId;

    let customer: Stripe.Customer;

    if (customerId) {
      // Use existing customer
      customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
    } else {
      // Create new customer
      customer = await stripe.customers.create({
        email: userData.email,
        metadata: { userId },
        name: userData.displayName
      });

      // Update user with customer ID
      await db.collection('users').doc(userId).update({
        'subscription.stripeCustomerId': customer.id
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl || `${functions.config().app.url}/dashboard?success=true`,
      cancel_url: cancelUrl || `${functions.config().app.url}/pricing?canceled=true`,
      metadata: {
        userId,
        plan: getPlanFromPriceId(priceId)
      },
      subscription_data: {
        metadata: {
          userId
        }
      }
    });

    return { sessionId: session.id, url: session.url };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create checkout session');
  }
});
```

### **3. Usage Tracking Function**
```typescript
// functions/src/track-usage.ts
export const trackUsage = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const { feature, tokensUsed = 0, metadata = {} } = data;

  try {
    // Get user subscription
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();
    const subscription = userData.subscription;

    // Check if user has subscription
    if (!subscription || subscription.status === 'free') {
      // For free users, check basic limits
      const currentUsage = userData.usage || {};
      const freeLimits = getPlanLimits('free');
      
      if (currentUsage[`${feature}Used`] >= freeLimits[`monthly${feature.charAt(0).toUpperCase() + feature.slice(1)}`]) {
        throw new functions.https.HttpsError('resource-exhausted', 'Free tier limit reached');
      }
    } else {
      // For paid users, check subscription limits
      const subscriptionDoc = await db.collection('subscriptions')
        .where('userId', '==', userId)
        .limit(1)
        .get();

      if (!subscriptionDoc.empty) {
        const subData = subscriptionDoc.docs[0].data();
        const limits = subData.limits;
        const usage = subData.usage;

        if (usage[`${feature}Used`] >= limits[`monthly${feature.charAt(0).toUpperCase() + feature.slice(1)}`]) {
          throw new functions.https.HttpsError('resource-exhausted', 'Monthly limit reached');
        }
      }
    }

    // Track usage
    const usageData = {
      userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      requestType: feature,
      tokensUsed,
      cost: 0, // Calculate based on your pricing model
      details: {
        success: true,
        metadata
      },
      subscriptionTier: subscription?.tier || 'free'
    };

    await db.collection('usageLogs').add(usageData);

    // Update user usage counters
    const updateData = {};
    updateData[`usage.${feature}Used`] = admin.firestore.FieldValue.increment(1);
    updateData['usage.lastUpdated'] = admin.firestore.FieldValue.serverTimestamp();

    await db.collection('users').doc(userId).update(updateData);

    // Update subscription usage if applicable
    if (subscription?.stripeSubscriptionId) {
      const subscriptionRef = db.collection('subscriptions')
        .where('userId', '==', userId)
        .limit(1);
      
      const subSnapshot = await subscriptionRef.get();
      if (!subSnapshot.empty) {
        await subSnapshot.docs[0].ref.update({
          [`usage.${feature}Used`]: admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }

    return { success: true, usageTracked: true };
  } catch (error) {
    console.error('Error tracking usage:', error);
    throw error;
  }
});
```

---

## 🎨 Frontend Integration

### **1. Subscription Context Hook**
```typescript
// src/contexts/SubscriptionContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SubscriptionContextType {
  subscription: any;
  loading: boolean;
  createCheckoutSession: (priceId: string) => Promise<string>;
  cancelSubscription: () => Promise<void>;
  updatePaymentMethod: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setSubscription(data.subscription);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to subscription:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const createCheckoutSession = async (priceId: string): Promise<string> => {
    const { getFunctions, httpsCallable } = await import('firebase/functions');
    const functions = getFunctions();
    const createCheckout = httpsCallable(functions, 'createCheckoutSession');
    
    const result = await createCheckout({ priceId });
    return (result.data as any).url;
  };

  const cancelSubscription = async (): Promise<void> => {
    // Redirect to Stripe customer portal
    const { getFunctions, httpsCallable } = await import('firebase/functions');
    const functions = getFunctions();
    const createPortalSession = httpsCallable(functions, 'createPortalSession');
    
    const result = await createPortalSession({});
    window.location.href = (result.data as any).url;
  };

  const value = {
    subscription,
    loading,
    createCheckoutSession,
    cancelSubscription,
    updatePaymentMethod: cancelSubscription // Same portal for payment method updates
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
```

### **2. Feature Access Control Component**
```typescript
// src/components/FeatureGate.tsx
import React from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface FeatureGateProps {
  children: React.ReactNode;
  requiredTier: 'free' | 'standard' | 'pro';
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

export function FeatureGate({ 
  children, 
  requiredTier, 
  fallback, 
  showUpgradePrompt = true 
}: FeatureGateProps) {
  const { subscription, loading } = useSubscription();

  if (loading) {
    return <div>Loading...</div>;
  }

  const tierOrder = { free: 0, standard: 1, pro: 2 };
  const userTier = subscription?.tier || 'free';
  const hasAccess = tierOrder[userTier] >= tierOrder[requiredTier];

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showUpgradePrompt) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg text-center">
        <h3 className="text-lg font-semibold mb-2">Upgrade Required</h3>
        <p className="text-gray-600 mb-4">
          This feature requires a {requiredTier} subscription or higher.
        </p>
        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Upgrade Now
        </button>
      </div>
    );
  }

  return null;
}
```

---

## 🔒 Security & Best Practices

### **1. Stripe Webhook Security**
```typescript
// Always verify webhook signatures
const event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);

// Use environment variables for secrets
const endpointSecret = functions.config().stripe.webhook_secret;
```

### **2. Firestore Security Rules**
```typescript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Subscriptions are read-only for users
    match /subscriptions/{subscriptionId} {
      allow read: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow write: if false; // Only Cloud Functions can write
    }
    
    // Usage logs are read-only for users
    match /usageLogs/{logId} {
      allow read: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow write: if false; // Only Cloud Functions can write
    }
  }
}
```

### **3. Cloud Function Security**
```typescript
// Always verify authentication
if (!context.auth) {
  throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
}

// Use callable functions for sensitive operations
exports.sensitiveOperation = functions.https.onCall(async (data, context) => {
  // Authentication is automatically verified
  const userId = context.auth.uid;
  // ... rest of function
});
```

### **4. Environment Configuration**
```bash
# .env.local
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Firebase Functions config
firebase functions:config:set stripe.secret_key="sk_test_..."
firebase functions:config:set stripe.webhook_secret="whsec_..."
firebase functions:config:set app.url="https://yourdomain.com"
```

---

## ✅ Implementation Checklist

### **Phase 1: Foundation Setup**
- [ ] Configure Stripe account and get API keys
- [ ] Set up Firebase Functions environment variables
- [ ] Create Firestore collections and security rules
- [ ] Implement basic user authentication flow

### **Phase 2: Core Integration**
- [ ] Implement Stripe webhook handlers
- [ ] Create checkout session creation function
- [ ] Build subscription management functions
- [ ] Set up usage tracking system

### **Phase 3: Frontend Integration**
- [ ] Create subscription context and hooks
- [ ] Implement feature gating components
- [ ] Build subscription management UI
- [ ] Add usage monitoring dashboard

### **Phase 4: Testing & Deployment**
- [ ] Test webhook handling with Stripe CLI
- [ ] Verify subscription flows end-to-end
- [ ] Test usage tracking and limits
- [ ] Deploy to production environment

### **Phase 5: Monitoring & Optimization**
- [ ] Set up error monitoring and logging
- [ ] Implement usage analytics
- [ ] Optimize performance and costs
- [ ] Add automated testing

---

## 🎯 Key Benefits of This Architecture

1. **Real-time Sync:** Webhooks ensure immediate subscription state updates
2. **Scalable:** Cloud Functions handle variable load automatically
3. **Secure:** Proper authentication and authorization at every level
4. **Maintainable:** Clear separation of concerns between Firebase and Stripe
5. **Cost-effective:** Pay-per-use Cloud Functions, no server maintenance
6. **Reliable:** Stripe handles payment processing, Firebase manages app state

---

## 🚀 Getting Started

1. **Clone and configure** your Firebase project
2. **Set up Stripe** account and webhook endpoints
3. **Deploy Cloud Functions** with the provided code
4. **Update frontend** with subscription context and components
5. **Test thoroughly** with Stripe test mode
6. **Go live** with production Stripe keys

This implementation provides a production-ready, scalable foundation for your PathGen SaaS application with proper separation of concerns, security, and real-time synchronization between Firebase and Stripe.
