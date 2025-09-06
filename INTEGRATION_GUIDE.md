# PathGen Credit Backend Integration Guide

## 🎯 Quick Start Integration

### 1. Add to Your Existing PathGen Project

```bash
# Copy the credit backend files to your existing project
cp src/lib/credit-backend-service.ts src/lib/
cp src/lib/stripe-webhook-handler.ts src/lib/
cp src/lib/credit-api-endpoints.ts src/lib/
cp src/server.ts src/credit-server.ts
```

### 2. Update Your Package.json

Add these dependencies to your existing `package.json`:

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "stripe": "^14.9.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17"
  }
}
```

### 3. Environment Variables

Add these to your existing `.env.local`:

```env
# Credit Backend Server
CREDIT_SERVER_PORT=3001

# Stripe Configuration (if not already present)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 4. Start the Credit Server

Add this script to your `package.json`:

```json
{
  "scripts": {
    "dev:credits": "ts-node src/credit-server.ts",
    "dev:all": "concurrently \"npm run dev\" \"npm run dev:credits\""
  }
}
```

Run both servers:
```bash
npm run dev:all
```

## 🔌 Frontend Integration

### Update Your Existing Credit System

Replace your existing credit tracking with calls to the new backend:

```typescript
// src/lib/credit-api-client.ts
class CreditAPIClient {
  private baseUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3001/api' 
    : 'https://your-domain.com/api';

  async deductCredits(userId: string, amount: number, feature: string) {
    const response = await fetch(`${this.baseUrl}/user/${userId}/deduct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, feature })
    });
    return response.json();
  }

  async checkCredits(userId: string, requiredAmount: number) {
    const response = await fetch(`${this.baseUrl}/user/${userId}/check-credits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requiredAmount })
    });
    return response.json();
  }

  async getUserCredits(userId: string) {
    const response = await fetch(`${this.baseUrl}/user/${userId}`);
    return response.json();
  }
}

export const creditAPI = new CreditAPIClient();
```

### Update Your AI Page

```typescript
// src/app/ai/page.tsx - Update the handleSendMessage function
const handleSendMessage = async () => {
  if (!inputMessage.trim() || !user || !currentChatId) return;

  // Check if user has enough credits
  const creditCheck = await creditAPI.checkCredits(user.uid, 1);
  if (!creditCheck.data.canPerformAction) {
    alert('Insufficient credits. You need 1 credit to send a message.');
    return;
  }

  // Deduct credits
  const deductResult = await creditAPI.deductCredits(user.uid, 1, 'ai_chat');
  if (!deductResult.success) {
    alert('Failed to use credits. Please try again.');
    return;
  }

  console.log('✅ Credit used successfully for AI chat');
  
  // Continue with message sending...
};
```

## 🔄 Stripe Webhook Setup

### 1. Configure Stripe Webhook

In your Stripe dashboard:
- Go to Webhooks
- Add endpoint: `https://your-domain.com/webhook/stripe`
- Select events:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`

### 2. Test Webhook Locally

Use ngrok for local testing:
```bash
# Install ngrok
npm install -g ngrok

# Start your credit server
npm run dev:credits

# In another terminal, expose port 3001
ngrok http 3001

# Use the ngrok URL in Stripe webhook configuration
```

## 📊 Database Migration

### Migrate Existing Users

If you have existing users, create a migration script:

```typescript
// scripts/migrate-existing-users.ts
import { getDb } from '../src/lib/firebase-admin-api';
import { creditService } from '../src/lib/credit-backend-service';

async function migrateExistingUsers() {
  const db = getDb();
  const usersSnapshot = await db.collection('users').get();
  
  for (const doc of usersSnapshot.docs) {
    const userData = doc.data();
    
    // Initialize user with correct credits
    const result = await creditService.initializeUser(
      doc.id,
      userData.displayName || userData.name || 'Unknown',
      userData.email,
      userData.subscriptionTier === 'pro' ? 'pro' : 'free',
      userData.subscriptionId,
      userData.stripeCustomerId
    );
    
    console.log(`Migrated user ${doc.id}:`, result);
  }
}

migrateExistingUsers();
```

## 🚀 Deployment

### Deploy to Firebase Functions

1. Create `functions/credit-backend/` directory
2. Copy the credit backend files
3. Update `functions/package.json` with dependencies
4. Deploy:

```bash
firebase deploy --only functions:creditBackend
```

### Deploy to Vercel

1. Create `api/` directory in your project root
2. Copy API endpoint files
3. Deploy:

```bash
vercel deploy
```

## 🧪 Testing

### Test the Credit System

```bash
# Test user initialization
curl -X POST http://localhost:3001/api/user/test123/initialize \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","accountType":"free"}'

# Test credit deduction
curl -X POST http://localhost:3001/api/user/test123/deduct \
  -H "Content-Type: application/json" \
  -d '{"amount":10,"feature":"ai_chat"}'

# Test credit check
curl -X POST http://localhost:3001/api/user/test123/check-credits \
  -H "Content-Type: application/json" \
  -d '{"requiredAmount":5}'
```

## 🔧 Configuration Options

### Customize Credit Amounts

Edit `src/lib/credit-backend-service.ts`:

```typescript
const CREDIT_LIMITS = {
  FREE_USER_INITIAL: 250,    // Change this
  PRO_USER_INITIAL: 4000,    // Change this
  MAX_TRANSACTION_HISTORY: 1000,
} as const;
```

### Customize Rate Limiting

Edit `src/server.ts`:

```typescript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // requests per window
  message: 'Too many requests'
});
```

## 📈 Monitoring

### Add Logging

```typescript
// Add to your existing logging system
console.log(`Credit operation: ${action} for user ${userId}, amount: ${amount}`);
```

### Add Analytics

```typescript
// Track credit usage in your analytics
analytics.track('credit_used', {
  userId,
  amount,
  feature,
  creditsRemaining
});
```

## 🆘 Troubleshooting

### Common Issues

1. **Port Conflicts**: Change `CREDIT_SERVER_PORT` in your `.env`
2. **CORS Errors**: Update `ALLOWED_ORIGINS` in server configuration
3. **Firebase Permissions**: Ensure service account has Firestore access
4. **Stripe Webhooks**: Verify webhook secret and endpoint URL

### Debug Mode

Enable debug logging:

```typescript
// Add to your environment
DEBUG=credit-backend:*
```

## 🎉 You're Ready!

Your PathGen app now has a robust, scalable credit tracking system that can handle thousands of users with automatic Stripe integration and comprehensive transaction history!
