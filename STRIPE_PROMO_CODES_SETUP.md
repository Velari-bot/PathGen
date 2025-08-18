# 🎫 Stripe Promo Codes Setup Guide for PathGen

This guide explains how to set up promo codes in Stripe for your PathGen subscription tiers.

## 📋 **Prerequisites**

1. **Stripe Account**: Active Stripe account with access to Dashboard
2. **Stripe API Keys**: Your secret and publishable keys configured
3. **Price IDs**: Your subscription price IDs from Stripe

## 🏗️ **Step 1: Create Coupons in Stripe Dashboard**

### **Navigate to Stripe Dashboard:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Products** → **Coupons**
3. Click **Create coupon**

### **Create Free Tier Promo Code:**
- **Coupon ID**: `FREETIER_PROMO`
- **Name**: `Free Tier Promotion`
- **Description**: `Makes Free tier completely free`
- **Amount off**: `100%`
- **Currency**: `USD`
- **Duration**: `Once` (or `Forever` if you want it permanent)
- **Redemption limit**: `Unlimited` (or set a specific number)
- **Click**: **Create coupon**

### **Create Standard Tier Promo Code:**
- **Coupon ID**: `STANDARD_PROMO`
- **Name**: `Standard Tier Discount`
- **Description**: `$2 off Standard tier subscription`
- **Amount off**: `$2.00`
- **Currency**: `USD`
- **Duration**: `Once` (or `Forever`)
- **Redemption limit**: `Unlimited` (or set a specific number)
- **Click**: **Create coupon**

### **Create Pro Tier Promo Code:**
- **Coupon ID**: `PRO_PROMO`
- **Name**: `Pro Tier Discount`
- **Description**: `$5 off Pro tier subscription`
- **Amount off**: `$5.00`
- **Currency**: `USD`
- **Duration**: `Once` (or `Forever`)
- **Redemption limit**: `Unlimited` (or set a specific number)
- **Click**: **Create coupon**

## 🔧 **Step 2: Update Your Environment Variables**

Add these to your `.env.local`:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...your_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...your_publishable_key

# Promo Code Coupon IDs
STRIPE_FREE_COUPON_ID=FREETIER_PROMO
STRIPE_STANDARD_COUPON_ID=STANDARD_PROMO
STRIPE_PRO_COUPON_ID=PRO_PROMO
```

## 🎯 **Step 3: How Promo Codes Work**

### **Free Tier Promo:**
- **Coupon**: `FREETIER_PROMO`
- **Discount**: 100% off
- **Result**: User gets Free tier for $0.00

### **Standard Tier Promo:**
- **Coupon**: `STANDARD_PROMO`
- **Discount**: $2.00 off
- **Result**: User pays $4.99 instead of $6.99

### **Pro Tier Promo:**
- **Coupon**: `PRO_PROMO`
- **Discount**: $5.00 off
- **Result**: User pays $19.99 instead of $24.99

## 🚀 **Step 4: Testing Promo Codes**

### **Test in Development:**
1. Use Stripe test cards
2. Apply promo codes during checkout
3. Verify discounts are applied correctly

### **Test Cards:**
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

## 📊 **Step 5: Monitor Usage**

### **In Stripe Dashboard:**
1. **Coupons** → View redemption counts
2. **Payments** → See applied discounts
3. **Customers** → Track who used promo codes

### **In Your App:**
- Promo codes are stored in subscription metadata
- Track usage in Firebase for analytics
- Monitor conversion rates with/without codes

## 🎨 **Step 6: Customize Promo Code Display**

### **Add Promo Code Validation:**
```typescript
// Validate promo codes before checkout
const validatePromoCode = async (code: string, tier: string) => {
  try {
    const response = await fetch('/api/validate-promo-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, tier })
    });
    
    if (response.ok) {
      const { valid, discount } = await response.json();
      return { valid, discount };
    }
    return { valid: false, discount: 0 };
  } catch (error) {
    return { valid: false, discount: 0 };
  }
};
```

### **Show Discount Preview:**
```typescript
// Display discount amount before checkout
const showDiscountPreview = (originalPrice: number, discount: number) => {
  const finalPrice = originalPrice - discount;
  return (
    <div className="text-green-400 text-sm">
      🎫 Promo applied: ${discount.toFixed(2)} off
      <br />
      <span className="line-through">${originalPrice.toFixed(2)}</span>
      <span className="text-white"> ${finalPrice.toFixed(2)}</span>
    </div>
  );
};
```

## 🔒 **Step 7: Security Considerations**

### **Rate Limiting:**
- Limit promo code attempts per user
- Implement cooldown periods
- Monitor for abuse patterns

### **Validation:**
- Verify coupon exists in Stripe before checkout
- Check coupon expiration dates
- Validate usage limits

### **Audit Trail:**
- Log all promo code usage
- Track successful vs failed applications
- Monitor conversion metrics

## 📈 **Step 8: Analytics & Reporting**

### **Track in Firebase:**
```typescript
// Log promo code usage
await FirebaseService.logPromoCodeUsage({
  userId: user.uid,
  promoCode: promoCode,
  tier: tier,
  discount: discount,
  timestamp: new Date()
});
```

### **Key Metrics:**
- Promo code redemption rate
- Conversion rate with/without codes
- Revenue impact of discounts
- User acquisition cost

## 🚨 **Troubleshooting**

### **Common Issues:**
1. **Coupon not found**: Verify coupon ID in Stripe Dashboard
2. **Discount not applied**: Check coupon configuration and expiration
3. **API errors**: Verify Stripe API keys and permissions

### **Debug Steps:**
1. Check Stripe Dashboard logs
2. Verify coupon status (active/inactive)
3. Test with Stripe CLI
4. Check application console logs

## 🎉 **Success!**

Your PathGen application now supports:
- ✅ **Free tier promo codes** (100% discount)
- ✅ **Standard tier promo codes** ($2 off)
- ✅ **Pro tier promo codes** ($5 off)
- ✅ **Real-time validation** in Stripe
- ✅ **Automatic discount application** at checkout
- ✅ **Usage tracking** in Firebase
- ✅ **Beautiful UI** with promo code inputs

## 📞 **Support**

For Stripe-specific issues:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com/)

For PathGen-specific issues:
- Check the application logs
- Verify environment variables
- Test promo codes in development mode
