# 🔧 Stripe Webhook Troubleshooting Guide

## 🚨 Current Issues Identified

### **Problem 1: Multiple Conflicting Webhook Endpoints**
You currently have **3 different webhook handlers** that are conflicting:

1. **Next.js API Route**: `src/app/api/webhooks/stripe/route.ts`
2. **Firebase Functions**: `functions/src/stripe-webhooks.ts` 
3. **Legacy Firebase Functions**: `functions/index.js`

### **Problem 2: Inconsistent User Subscription Updates**
- Some webhook handlers don't properly update user documents
- Missing comprehensive subscription data in user profiles
- Inconsistent error handling and logging

### **Problem 3: Webhook Secret Configuration**
- Different endpoints using different secret configurations
- Potential signature verification failures

## ✅ Solutions Implemented

### **1. Enhanced Next.js Webhook Handler**
- ✅ **Improved subscription creation** with comprehensive user updates
- ✅ **Enhanced subscription updates** with proper user document updates
- ✅ **Better payment success handling** with user status updates
- ✅ **Comprehensive logging** for debugging and monitoring
- ✅ **Error handling** with detailed error logging

### **2. Webhook Debugging Tools**
- ✅ **Webhook Status Monitor** at `/admin/webhooks`
- ✅ **Debug API** at `/api/webhooks/debug`
- ✅ **Manual retry functionality** for failed webhook events
- ✅ **Real-time statistics** and failure tracking

### **3. Comprehensive Logging**
- ✅ **All webhook events** logged to `webhookLogs` collection
- ✅ **Success/failure tracking** with detailed error messages
- ✅ **User and subscription ID tracking** for debugging

## 🛠️ Recommended Actions

### **Step 1: Choose Primary Webhook Endpoint**

**Option A: Use Next.js API Route (Recommended)**
```
https://pathgen.online/api/webhooks/stripe
```

**Option B: Use Firebase Functions**
```
https://us-central1-your-project.cloudfunctions.net/stripeWebhook
```

### **Step 2: Update Stripe Dashboard**

1. **Go to Stripe Dashboard** → Webhooks
2. **Delete old webhook endpoints** that are no longer needed
3. **Update primary endpoint** to use the chosen URL
4. **Verify webhook secret** matches your environment variables

### **Step 3: Environment Variables**

Ensure these are set correctly:

```env
# For Next.js API Route
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# For Firebase Functions
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### **Step 4: Test Webhook Endpoints**

1. **Use Stripe CLI** to test webhooks locally:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

2. **Send test events**:
```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
```

### **Step 5: Monitor Webhook Performance**

1. **Visit** `/admin/webhooks` to monitor webhook events
2. **Check success rates** and identify failures
3. **Use retry functionality** for failed events
4. **Monitor logs** for any recurring issues

## 🔍 Debugging Failed Webhooks

### **Common Issues & Solutions**

#### **1. Signature Verification Failed**
```
Error: Webhook signature verification failed
```
**Solution**: 
- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Ensure webhook endpoint URL matches exactly
- Check that raw body is being used for signature verification

#### **2. User Not Found**
```
Error: No userId found in customer metadata
```
**Solution**:
- Ensure `userId` is set in customer metadata when creating checkout sessions
- Check customer creation process
- Verify customer metadata is preserved

#### **3. Subscription Update Failed**
```
Error: Error handling subscription update
```
**Solution**:
- Check Firestore permissions
- Verify subscription document exists
- Ensure user document exists and is accessible

### **Manual Retry Process**

1. **Go to** `/admin/webhooks`
2. **Find failed webhook events**
3. **Click "Retry"** button for subscription-related failures
4. **Monitor** for successful completion

## 📊 Monitoring & Maintenance

### **Daily Checks**
- [ ] Check webhook success rate at `/admin/webhooks`
- [ ] Review any failed events
- [ ] Verify user subscription statuses

### **Weekly Checks**
- [ ] Review webhook performance trends
- [ ] Check for recurring failure patterns
- [ ] Update webhook secrets if needed

### **Monthly Checks**
- [ ] Review webhook logs for optimization opportunities
- [ ] Update webhook event handling if needed
- [ ] Test webhook endpoints thoroughly

## 🚀 Next Steps

1. **Choose your primary webhook endpoint** (Next.js recommended)
2. **Update Stripe dashboard** with correct endpoint
3. **Test webhook functionality** thoroughly
4. **Monitor webhook performance** using the new tools
5. **Remove unused webhook endpoints** to avoid conflicts

## 📞 Support

If you continue to experience issues:

1. **Check webhook logs** at `/admin/webhooks`
2. **Review error messages** in the logs
3. **Use manual retry** for failed events
4. **Contact support** with specific error details

The enhanced webhook system should resolve your subscription update issues and provide better visibility into webhook performance.
