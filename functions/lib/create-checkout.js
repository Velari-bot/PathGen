"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubscriptionInfo = exports.createPortalSession = exports.createCheckoutSession = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const stripe_1 = __importDefault(require("stripe"));
const subscription_1 = require("./types/subscription");
// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const stripe = new stripe_1.default(functions.config().stripe.secret_key, {
    apiVersion: '2023-10-16'
});
// Create checkout session for subscription
exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
    var _a, _b, _c;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = context.auth.uid;
    const { priceId, successUrl, cancelUrl } = data;
    try {
        // Validate price ID
        if (!priceId) {
            throw new functions.https.HttpsError('invalid-argument', 'Price ID is required');
        }
        // Get user data
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User not found');
        }
        const userData = userDoc.data();
        if (!userData) {
            throw new functions.https.HttpsError('not-found', 'User data not found');
        }
        const customerId = (_a = userData.subscription) === null || _a === void 0 ? void 0 : _a.stripeCustomerId;
        let customer;
        if (customerId) {
            // Use existing customer
            try {
                customer = await stripe.customers.retrieve(customerId);
            }
            catch (error) {
                console.error('Error retrieving existing customer:', error);
                // Create new customer if retrieval fails
                customer = await stripe.customers.create({
                    email: userData.email,
                    metadata: { userId },
                    name: userData.displayName || ((_b = userData.email) === null || _b === void 0 ? void 0 : _b.split('@')[0]) || 'User'
                });
            }
        }
        else {
            // Create new customer
            customer = await stripe.customers.create({
                email: userData.email,
                metadata: { userId },
                name: userData.displayName || ((_c = userData.email) === null || _c === void 0 ? void 0 : _c.split('@')[0]) || 'User'
            });
            // Update user with customer ID
            await db.collection('users').doc(userId).update({
                'subscription.stripeCustomerId': customer.id
            });
        }
        // Get plan information
        const plan = (0, subscription_1.getPlanFromPriceId)(priceId);
        // Set default URLs if not provided
        const defaultSuccessUrl = `${functions.config().app.url}/dashboard?success=true&plan=${plan}`;
        const defaultCancelUrl = `${functions.config().app.url}/pricing?canceled=true`;
        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customer.id,
            payment_method_types: ['card'],
            line_items: [{
                    price: priceId,
                    quantity: 1
                }],
            mode: 'subscription',
            success_url: successUrl || defaultSuccessUrl,
            cancel_url: cancelUrl || defaultCancelUrl,
            metadata: {
                userId,
                plan
            },
            subscription_data: {
                metadata: {
                    userId
                },
                trial_period_days: plan === 'pro' ? 7 : 0, // 7-day trial for Pro plan
            },
            billing_address_collection: 'required',
            customer_update: {
                address: 'auto',
                name: 'auto'
            },
            allow_promotion_codes: true,
            expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
            locale: 'auto'
        });
        // Log checkout session creation
        await db.collection('checkoutSessions').doc(session.id).set({
            userId,
            sessionId: session.id,
            priceId,
            plan,
            customerId: customer.id,
            status: 'created',
            createdAt: admin.firestore.Timestamp.now(),
            expiresAt: admin.firestore.Timestamp.fromDate(new Date(session.expires_at * 1000))
        });
        const response = {
            sessionId: session.id,
            url: session.url
        };
        console.log(`Checkout session created for user ${userId} with plan ${plan}`);
        return response;
    }
    catch (error) {
        console.error('Error creating checkout session:', error);
        if (error.type === 'StripeCardError') {
            throw new functions.https.HttpsError('failed-precondition', 'Payment method was declined');
        }
        else if (error.type === 'StripeInvalidRequestError') {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid request to Stripe');
        }
        else if (error.type === 'StripeAPIError') {
            throw new functions.https.HttpsError('unavailable', 'Stripe service temporarily unavailable');
        }
        else {
            throw new functions.https.HttpsError('internal', 'Failed to create checkout session');
        }
    }
});
// Create customer portal session for subscription management
exports.createPortalSession = functions.https.onCall(async (data, context) => {
    var _a;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = context.auth.uid;
    const { returnUrl } = data;
    try {
        // Get user data
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User not found');
        }
        const userData = userDoc.data();
        if (!userData) {
            throw new functions.https.HttpsError('not-found', 'User data not found');
        }
        const customerId = (_a = userData === null || userData === void 0 ? void 0 : userData.subscription) === null || _a === void 0 ? void 0 : _a.stripeCustomerId;
        if (!customerId) {
            throw new functions.https.HttpsError('failed-precondition', 'No Stripe customer found');
        }
        // Create portal session
        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl || `${functions.config().app.url}/dashboard`,
            configuration: functions.config().stripe.portal_configuration_id || undefined
        });
        // Log portal session creation
        await db.collection('portalSessions').doc(session.id).set({
            userId,
            sessionId: session.id,
            customerId,
            createdAt: admin.firestore.Timestamp.now()
        });
        console.log(`Portal session created for user ${userId}`);
        return { url: session.url };
    }
    catch (error) {
        console.error('Error creating portal session:', error);
        throw new functions.https.HttpsError('internal', 'Failed to create portal session');
    }
});
// Get subscription information
exports.getSubscriptionInfo = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = context.auth.uid;
    try {
        // Get user subscription data
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User not found');
        }
        const userData = userDoc.data();
        if (!userData) {
            throw new functions.https.HttpsError('not-found', 'User data not found');
        }
        const subscription = userData === null || userData === void 0 ? void 0 : userData.subscription;
        if (!subscription || !subscription.stripeSubscriptionId) {
            return { subscription: null };
        }
        // Get detailed subscription info from Stripe
        const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
        // Get upcoming invoice for next billing
        let upcomingInvoice = null;
        try {
            upcomingInvoice = await stripe.invoices.retrieveUpcoming({
                customer: subscription.stripeCustomerId,
                subscription: subscription.stripeSubscriptionId
            });
        }
        catch (error) {
            console.log('No upcoming invoice found');
        }
        return {
            subscription: Object.assign(Object.assign({}, subscription), { stripeData: {
                    status: stripeSubscription.status,
                    currentPeriodStart: stripeSubscription.current_period_start,
                    currentPeriodEnd: stripeSubscription.current_period_end,
                    cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
                    trialEnd: stripeSubscription.trial_end
                }, upcomingInvoice: upcomingInvoice ? {
                    amountDue: upcomingInvoice.amount_due,
                    nextPaymentAttempt: upcomingInvoice.next_payment_attempt
                } : null })
        };
    }
    catch (error) {
        console.error('Error getting subscription info:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get subscription information');
    }
});
//# sourceMappingURL=create-checkout.js.map