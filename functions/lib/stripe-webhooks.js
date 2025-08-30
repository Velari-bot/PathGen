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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhook = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const stripe_1 = __importDefault(require("stripe"));
// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
// Get Stripe configuration from environment variables
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || ((_a = functions.config().stripe) === null || _a === void 0 ? void 0 : _a.secret_key);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ((_b = functions.config().stripe) === null || _b === void 0 ? void 0 : _b.webhook_secret);
if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
}
if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
}
const stripe = new stripe_1.default(stripeSecretKey, {
    apiVersion: '2023-10-16'
});
// Stripe webhook handler
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
    // Set CORS headers for preflight requests
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Stripe-Signature');
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).send('');
        return;
    }
    // Only allow POST requests
    if (req.method !== 'POST') {
        console.log(`⚠️ Invalid method: ${req.method}`);
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    const sig = req.headers['stripe-signature'];
    if (!sig) {
        console.error('❌ No Stripe signature found in headers');
        res.status(400).json({ error: 'No Stripe signature found' });
        return;
    }
    let event;
    try {
        // Get the raw body for signature verification
        let rawBody;
        if (req.rawBody) {
            rawBody = req.rawBody;
        }
        else if (req.body) {
            // If body is already parsed, we need to get the raw buffer
            rawBody = Buffer.from(JSON.stringify(req.body), 'utf8');
        }
        else {
            console.error('❌ No request body found');
            res.status(400).json({ error: 'No request body found' });
            return;
        }
        // Verify the webhook signature
        event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
        console.log(`📦 Event: ${event.type}`);
    }
    catch (err) {
        console.error('❌ Webhook signature verification failed:', err.message);
        res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
        return;
    }
    try {
        // Log every incoming event type
        console.log(`📦 Event: ${event.type}`);
        // Handle the specific event types
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutSessionCompleted(event.data.object);
                break;
            case 'invoice.payment_failed':
                await handleInvoicePaymentFailed(event.data.object);
                break;
            case 'customer.subscription.created':
                await handleSubscriptionCreated(event.data.object);
                break;
            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object);
                break;
            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object);
                break;
            case 'invoice.payment_succeeded':
                await handlePaymentSucceeded(event.data.object);
                break;
            case 'customer.subscription.trial_will_end':
                await handleTrialWillEnd(event.data.object);
                break;
            case 'customer.updated':
                await handleCustomerUpdated(event.data.object);
                break;
            default:
                // Log all other unhandled events but still return success
                console.log(`⚠️ Unhandled event type: ${event.type}`);
        }
        // Log webhook event to database for tracking
        try {
            await db.collection('webhookEvents').doc(event.id).set({
                eventId: event.id,
                eventType: event.type,
                eventData: event.data,
                processed: true,
                processedAt: admin.firestore.Timestamp.now(),
                createdAt: admin.firestore.Timestamp.now()
            });
        }
        catch (dbError) {
            // Log database error but don't fail the webhook
            console.error('⚠️ Failed to log webhook to database:', dbError);
        }
        // Always return 200 for all events, even unhandled ones
        console.log(`✅ Webhook processed successfully: ${event.type}`);
        res.status(200).json({ received: true });
    }
    catch (error) {
        console.error('❌ Error processing webhook:', error);
        // Log error to database but don't fail the webhook
        try {
            await db.collection('webhookEvents').doc(event.id).set({
                eventId: event.id,
                eventType: event.type,
                eventData: event.data,
                processed: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                processedAt: admin.firestore.Timestamp.now(),
                createdAt: admin.firestore.Timestamp.now()
            });
        }
        catch (dbError) {
            console.error('⚠️ Failed to log error to database:', dbError);
        }
        // Still return 200 to prevent Stripe from retrying
        res.status(200).json({
            received: true,
            error: 'Webhook processing failed but acknowledged'
        });
    }
});
// Handle checkout.session.completed - confirm payment and grant user access
async function handleCheckoutSessionCompleted(session) {
    console.log(`💰 Processing checkout completion for session: ${session.id}`);
    if (!session.subscription) {
        console.log('⚠️ No subscription found in checkout session');
        return;
    }
    try {
        // Retrieve the subscription to get full details
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        await handleSubscriptionCreated(subscription);
        console.log(`✅ Checkout completed and subscription activated for session: ${session.id}`);
    }
    catch (error) {
        console.error('❌ Error processing checkout completion:', error);
        throw error; // Re-throw to be caught by main handler
    }
}
// Handle invoice.payment_failed - log failure and potentially revoke access
async function handleInvoicePaymentFailed(invoice) {
    console.log(`💸 Processing payment failure for invoice: ${invoice.id}`);
    if (invoice.subscription) {
        try {
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
            const customerId = subscription.customer;
            const customer = await stripe.customers.retrieve(customerId);
            if (!customer.deleted) {
                const userId = customer.metadata.userId;
                if (userId) {
                    // Update user subscription status to past_due
                    await db.collection('users').doc(userId).update({
                        'subscription.status': 'past_due',
                        'subscription.updatedAt': admin.firestore.Timestamp.now()
                    });
                    // Update subscription document
                    await db.collection('subscriptions').doc(subscription.id).update({
                        status: 'past_due',
                        updatedAt: admin.firestore.Timestamp.now()
                    });
                    console.log(`⚠️ Payment failed for user ${userId}, subscription set to past_due`);
                    // TODO: Send payment failure notification to user
                    // TODO: Implement grace period before revoking access
                }
            }
        }
        catch (error) {
            console.error('❌ Error processing payment failure:', error);
            throw error;
        }
    }
}
// Handle subscription created
async function handleSubscriptionCreated(subscription) {
    console.log(`🆕 Processing subscription creation: ${subscription.id}`);
    const customerId = subscription.customer;
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) {
        console.error('❌ Customer was deleted');
        return;
    }
    const userId = customer.metadata.userId;
    if (!userId) {
        console.error('❌ No userId in customer metadata');
        return;
    }
    const plan = getPlanFromPriceId(subscription.items.data[0].price.id);
    const planLimits = getPlanLimits(plan);
    // Create subscription document
    const subscriptionData = {
        userId,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customerId,
        plan,
        status: subscription.status === 'active' ? 'active' : 'unpaid',
        currentPeriodStart: admin.firestore.Timestamp.fromDate(new Date(subscription.current_period_start * 1000)),
        currentPeriodEnd: admin.firestore.Timestamp.fromDate(new Date(subscription.current_period_end * 1000)),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        trialEnd: subscription.trial_end ? admin.firestore.Timestamp.fromDate(new Date(subscription.trial_end * 1000)) : null,
        limits: planLimits,
        usage: {
            messagesUsed: 0,
            tokensUsed: 0,
            dataPullsUsed: 0,
            replayUploadsUsed: 0,
            tournamentStrategiesUsed: 0,
            resetDate: admin.firestore.Timestamp.fromDate(new Date())
        },
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now()
    };
    // Update user document
    await db.collection('users').doc(userId).update({
        subscription: subscriptionData,
        'subscription.plan': plan,
        'subscription.status': subscription.status
    });
    // Create subscription document
    await db.collection('subscriptions').doc(subscription.id).set(subscriptionData);
    console.log(`✅ Subscription created for user ${userId}: ${plan}`);
    // TODO: Send welcome email/notification
    await sendSubscriptionWelcomeEmail(userId, plan);
}
// Handle subscription updated
async function handleSubscriptionUpdated(subscription) {
    console.log(`🔄 Processing subscription update: ${subscription.id}`);
    const customerId = subscription.customer;
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) {
        console.error('❌ Customer was deleted');
        return;
    }
    const userId = customer.metadata.userId;
    if (!userId) {
        console.error('❌ No userId in customer metadata');
        return;
    }
    // Update subscription document
    await db.collection('subscriptions').doc(subscription.id).update({
        status: subscription.status,
        currentPeriodStart: admin.firestore.Timestamp.fromDate(new Date(subscription.current_period_start * 1000)),
        currentPeriodEnd: admin.firestore.Timestamp.fromDate(new Date(subscription.current_period_end * 1000)),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        trialEnd: subscription.trial_end ? admin.firestore.Timestamp.fromDate(new Date(subscription.trial_end * 1000)) : null,
        updatedAt: admin.firestore.Timestamp.now()
    });
    // Update user document
    await db.collection('users').doc(userId).update({
        'subscription.status': subscription.status,
        'subscription.updatedAt': admin.firestore.Timestamp.now()
    });
    console.log(`✅ Subscription updated for user ${userId}: ${subscription.status}`);
}
// Handle subscription deleted
async function handleSubscriptionDeleted(subscription) {
    console.log(`🗑️ Processing subscription deletion: ${subscription.id}`);
    const customerId = subscription.customer;
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) {
        console.error('❌ Customer was deleted');
        return;
    }
    const userId = customer.metadata.userId;
    if (!userId) {
        console.error('❌ No userId in customer metadata');
        return;
    }
    // Update subscription document
    await db.collection('subscriptions').doc(subscription.id).update({
        status: 'canceled',
        updatedAt: admin.firestore.Timestamp.now()
    });
    // Update user document to free tier
    await db.collection('users').doc(userId).update({
        'subscription.plan': 'free',
        'subscription.status': 'canceled',
        'subscription.updatedAt': admin.firestore.Timestamp.now()
    });
    console.log(`✅ Subscription canceled for user ${userId}`);
}
// Handle payment succeeded
async function handlePaymentSucceeded(invoice) {
    console.log(`💳 Processing payment success for invoice: ${invoice.id}`);
    if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        await handleSubscriptionUpdated(subscription);
    }
}
// Handle trial ending
async function handleTrialWillEnd(subscription) {
    console.log(`⏰ Processing trial ending for subscription: ${subscription.id}`);
    const customerId = subscription.customer;
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) {
        console.error('❌ Customer was deleted');
        return;
    }
    const userId = customer.metadata.userId;
    if (!userId) {
        console.error('❌ No userId in customer metadata');
        return;
    }
    console.log(`⚠️ Trial ending for user ${userId}`);
    // TODO: Send trial ending notification
}
// Handle customer updated
async function handleCustomerUpdated(customer) {
    console.log(`👤 Processing customer update: ${customer.id}`);
    const userId = customer.metadata.userId;
    if (!userId) {
        console.error('❌ No userId in customer metadata');
        return;
    }
    // Update user document
    await db.collection('users').doc(userId).update({
        'subscription.stripeCustomerId': customer.id,
        'subscription.updatedAt': admin.firestore.Timestamp.now()
    });
    console.log(`✅ Customer updated for user ${userId}`);
}
// Helper functions
function getPlanFromPriceId(priceId) {
    const priceMap = {
        'price_free': 'free',
        'price_1RvsvqCitWuvPenEw9TefOig': 'pro' // PathGen Pro
    };
    return priceMap[priceId] || 'free';
}
function getPlanLimits(plan) {
    const limits = {
        free: { messagesUsed: 10, tokensUsed: 1000, dataPullsUsed: 5, replayUploadsUsed: 2, tournamentStrategiesUsed: 3 },
        standard: { messagesUsed: 100, tokensUsed: 10000, dataPullsUsed: 50, replayUploadsUsed: 20, tournamentStrategiesUsed: 30 },
        pro: { messagesUsed: -1, tokensUsed: -1, dataPullsUsed: -1, replayUploadsUsed: -1, tournamentStrategiesUsed: -1 }
    };
    return limits[plan] || limits.free;
}
// Placeholder functions for notifications
async function sendSubscriptionWelcomeEmail(userId, plan) {
    console.log(`📧 Welcome email sent to user ${userId} for plan ${plan}`);
    // TODO: Implement actual email sending
}
//# sourceMappingURL=stripe-webhooks.js.map