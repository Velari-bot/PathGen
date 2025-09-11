# 🤝 PathGen Affiliate System

A complete affiliate marketing system for PathGen with Stripe integration and Firebase backend.

## 🏗️ **System Architecture**

### **Tech Stack**
- **Backend**: Firebase Cloud Functions + Next.js API Routes
- **Database**: Firestore
- **Payments**: Stripe Checkout & Webhooks
- **Frontend**: React/Next.js

### **Key Features**
- ✅ Unique referral codes (`?ref=ABC123`)
- ✅ 15% commission tracking
- ✅ Self-referral prevention
- ✅ Real-time dashboard
- ✅ Automated payouts (manual for now)
- ✅ Comprehensive analytics

---

## 📊 **Firestore Schema**

### **Collection: `affiliates`**
```typescript
{
  id: string,                    // Auto-generated document ID
  userId: string,                // PathGen user who became affiliate
  email: string,
  displayName: string,
  referralCode: string,          // Unique 8-char code (e.g., "ABC123")
  totalEarnings: number,         // Total earned in cents
  pendingEarnings: number,       // Not yet paid out
  paidEarnings: number,          // Already paid
  totalReferrals: number,        // Successful conversions
  commissionRate: number,        // Default 0.15 (15%)
  status: 'active' | 'suspended' | 'pending_approval',
  paymentInfo: {
    method: 'paypal' | 'stripe' | 'bank_transfer',
    details: string              // PayPal email, bank info, etc.
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### **Collection: `affiliate_earnings`**
```typescript
{
  id: string,
  affiliateId: string,           // Reference to affiliate
  customerId: string,            // Stripe customer ID
  subscriptionId: string,        // Stripe subscription ID
  orderId: string,               // Checkout session ID
  amountEarned: number,          // Commission in cents
  originalAmount: number,        // Purchase amount in cents
  commissionRate: number,        // Rate used (e.g., 0.15)
  currency: string,              // 'usd'
  status: 'pending' | 'approved' | 'paid' | 'cancelled',
  metadata: {
    productName: string,
    customerEmail: string,
    referralCode: string
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### **Collection: `affiliate_clicks`**
```typescript
{
  id: string,
  affiliateId: string,
  userId: string,                // User who clicked
  referralCode: string,
  timestamp: Timestamp,
  userAgent: string,
  ipAddress: string,
  source: string                 // 'checkout_creation', 'landing_page', etc.
}
```

### **Collection: `affiliate_stats`**
```typescript
{
  id: string,                    // Format: "{affiliateId}_{YYYY-MM-DD}"
  affiliateId: string,
  period: 'daily' | 'weekly' | 'monthly',
  date: string,                  // YYYY-MM-DD
  clicks: number,
  conversions: number,
  conversionRate: number,
  totalEarnings: number,
  averageOrderValue: number,
  topProducts: string[],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## 🔄 **System Flow**

### **1. Affiliate Registration**
```
User → /api/affiliate/register → Creates affiliate record → Returns referral code
```

### **2. Referral Process**
```
Visitor clicks: https://pathgen.online?ref=ABC123
→ Checkout creation includes affiliate_id in metadata
→ Stripe processes payment
→ Webhook triggers commission calculation
→ Earnings recorded in Firestore
```

### **3. Commission Calculation**
```
Payment Success → 15% commission → Pending status → Manual approval → Payout
```

---

## 🛠️ **API Endpoints**

### **Affiliate Registration**
```bash
POST /api/affiliate/register
{
  "userId": "user123",
  "email": "affiliate@example.com",
  "displayName": "John Doe",
  "paymentMethod": "paypal",
  "paymentDetails": "john@paypal.com"
}

Response:
{
  "success": true,
  "affiliateId": "aff_123",
  "referralCode": "ABC123",
  "referralUrl": "https://pathgen.online?ref=ABC123"
}
```

### **Create Checkout with Referral**
```bash
POST /api/affiliate/create-checkout
{
  "priceId": "price_123",
  "userId": "user456",
  "referralCode": "ABC123"
}

Response:
{
  "sessionId": "cs_123",
  "url": "https://checkout.stripe.com/...",
  "affiliateTracked": true
}
```

### **Affiliate Dashboard**
```bash
GET /api/affiliate/dashboard?userId=user123

Response:
{
  "affiliate": {...},
  "recentEarnings": [...],
  "monthlyStats": {...},
  "performanceMetrics": {...}
}
```

---

## 🔧 **Setup Instructions**

### **1. Environment Variables**
```env
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET_AFFILIATE=whsec_...

# Firebase
FIREBASE_PROJECT_ID=pathgen-xxx
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...

# App
NEXT_PUBLIC_BASE_URL=https://pathgen.online
```

### **2. Stripe Webhook Setup**
1. Create webhook endpoint: `https://yourdomain.com/api/webhooks/affiliate`
2. Select events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`
3. Copy webhook secret to environment variables

### **3. Firebase Security Rules**
```javascript
// Firestore Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Affiliates can read their own data
    match /affiliates/{affiliateId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Affiliate earnings are read-only for affiliates
    match /affiliate_earnings/{earningId} {
      allow read: if request.auth != null && 
        resource.data.affiliateId in get(/databases/$(database)/documents/affiliates/$(resource.data.affiliateId)).data.userId;
    }
    
    // Public read for affiliate stats (for leaderboards)
    match /affiliate_stats/{statId} {
      allow read: if true;
      allow write: if false; // Only server can write
    }
  }
}
```

---

## 🎯 **Usage Examples**

### **Frontend Integration**

#### **Detect Referral Code**
```typescript
// pages/_app.tsx or layout.tsx
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const referralCode = urlParams.get('ref');
  
  if (referralCode) {
    // Store in localStorage or state
    localStorage.setItem('pathgen_referral', referralCode);
  }
}, []);
```

#### **Create Checkout with Referral**
```typescript
const createCheckout = async () => {
  const referralCode = localStorage.getItem('pathgen_referral');
  
  const response = await fetch('/api/affiliate/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      priceId: 'price_123',
      userId: user.uid,
      referralCode
    })
  });
  
  const { url } = await response.json();
  window.location.href = url;
};
```

#### **Affiliate Dashboard Component**
```typescript
const AffiliateDashboard = () => {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetch(`/api/affiliate/dashboard?userId=${user.uid}`)
      .then(res => res.json())
      .then(setData);
  }, []);
  
  return (
    <div>
      <h2>Affiliate Dashboard</h2>
      <p>Referral Code: {data?.affiliate.referralCode}</p>
      <p>Total Earnings: ${(data?.affiliate.totalEarnings / 100).toFixed(2)}</p>
      <p>Pending: ${(data?.affiliate.pendingEarnings / 100).toFixed(2)}</p>
    </div>
  );
};
```

---

## 🔍 **Testing**

### **Test Referral Flow**
1. Register as affiliate: `POST /api/affiliate/register`
2. Get referral code: `ABC123`
3. Visit: `https://pathgen.online?ref=ABC123`
4. Complete checkout
5. Check webhook logs and affiliate_earnings collection

### **Webhook Testing**
```bash
# Use Stripe CLI to forward webhooks
stripe listen --forward-to localhost:3000/api/webhooks/affiliate

# Trigger test event
stripe trigger checkout.session.completed
```

---

## 🚀 **Deployment**

### **1. Deploy Functions**
```bash
cd functions
npm run build
firebase deploy --only functions
```

### **2. Deploy Next.js**
```bash
npm run build
vercel deploy
```

### **3. Update Webhook URLs**
Update Stripe webhook endpoints to production URLs.

---

## 📈 **Analytics & Reporting**

### **Key Metrics**
- **Conversion Rate**: Clicks → Purchases
- **Average Order Value**: Revenue per conversion
- **Top Performers**: Best converting affiliates
- **Monthly Trends**: Growth over time

### **Available Reports**
- Affiliate performance dashboard
- Earnings breakdown by status
- Click tracking and attribution
- Payout history and reconciliation

---

## 🔐 **Security Features**

- ✅ **Self-referral prevention**
- ✅ **Webhook signature verification**
- ✅ **Rate limiting on registration**
- ✅ **Input validation and sanitization**
- ✅ **Firestore security rules**
- ✅ **Grace period for cancellations**

---

## 🎉 **Ready to Launch!**

Your affiliate system is production-ready with:
- Automated commission tracking
- Real-time analytics
- Secure payment processing
- Scalable cloud architecture

Need help? Check the logs in Firebase Console or Stripe Dashboard for troubleshooting.
