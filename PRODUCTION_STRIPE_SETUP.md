# 🚀 Production Stripe Webhook Setup Guide

## ✅ **What's Been Fixed**

### **1. Firebase Functions (Development)**
- ✅ Raw body configuration for Stripe webhooks
- ✅ Enhanced subscription update logic
- ✅ Better error handling
- ✅ Proper user document updates

### **2. Next.js API Routes (Production)**
- ✅ Production webhook endpoint: `/api/stripe`
- ✅ Firebase Admin SDK integration
- ✅ Comprehensive event handling
- ✅ Error handling and logging

## 🔗 **Production URLs**

### **Main Webhook Endpoint:**
```
https://pathgen.online/api/stripe
```

### **Test Endpoint:**
```
https://pathgen.online/api/stripe/test
```

## 📋 **Setup Instructions**

### **Step 1: Update Stripe Dashboard**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Find your existing webhook endpoint
3. Update the URL to: `https://pathgen.online/api/stripe`
4. Save the changes

### **Step 2: Verify Environment Variables**
Make sure these are set in your production environment:
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@pathgen-a771b.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_PROJECT_ID=pathgen-a771b
```

### **Step 3: Deploy to Production**
```bash
# Build and deploy
npm run build
# Deploy to your hosting platform (Vercel, etc.)
```

### **Step 4: Test the Webhook**
1. Visit: `https://pathgen.online/api/stripe/test`
2. Should return: `{"status":"ok","message":"Stripe webhook endpoint is ready for production"}`

## 🎯 **What Events Are Handled**

### **Subscription Events:**
- ✅ `customer.subscription.created` - Creates new subscription
- ✅ `customer.subscription.updated` - Updates existing subscription
- ✅ `customer.subscription.deleted` - Marks subscription as canceled

### **Payment Events:**
- ✅ `invoice.payment_succeeded` - Activates subscription
- ✅ `invoice.payment_failed` - Marks subscription as past due

### **Checkout Events:**
- ✅ `checkout.session.completed` - Handles successful checkouts
- ✅ `customer.created` - Logs new customer creation
- ✅ `payment_method.attached` - Logs payment method attachment

## 🔧 **User Subscription Updates**

### **What Gets Updated:**
1. **Firebase Subscriptions Collection** - Stores subscription details
2. **User Document** - Updates user's subscription status
3. **Usage Tracking** - Initializes usage limits
4. **Webhook Logs** - Logs all events for debugging

### **Subscription Status Flow:**
```
Checkout → Pending → Payment Success → Active
```

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **Webhook Signature Verification Failed**
   - Check `STRIPE_WEBHOOK_SECRET` is correct
   - Verify webhook URL in Stripe Dashboard

2. **Firebase Connection Issues**
   - Check `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY`
   - Verify Firebase project ID

3. **User Document Not Found**
   - Webhook will create user document if it doesn't exist
   - Check Firebase logs for errors

### **Testing:**
1. Create a test subscription
2. Check Firebase for subscription document
3. Verify user document is updated
4. Check webhook logs in Stripe Dashboard

## 📊 **Monitoring**

### **Firebase Collections to Monitor:**
- `subscriptions` - All subscription data
- `users` - User subscription status
- `webhookLogs` - Event logging

### **Stripe Dashboard:**
- Webhook delivery status
- Event logs
- Error messages

## ✅ **Success Indicators**

When everything is working correctly:
1. ✅ Stripe webhook shows "200 OK" responses
2. ✅ User subscription status updates in Firebase
3. ✅ No signature verification errors
4. ✅ Subscription documents created in Firebase
5. ✅ User documents updated with subscription info

---

**🎉 Your Stripe webhook integration is now production-ready!**
