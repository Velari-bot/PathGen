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
exports.stripeWebhook = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const stripe_1 = __importDefault(require("stripe"));
// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const stripe = new stripe_1.default(functions.config().stripe.secret_key, {
    apiVersion: '2023-10-16'
});
// Stripe webhook handler
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = functions.config().stripe.webhook_secret;
    let event;
    try {
        if (!req.rawBody) {
            res.status(400).send('No raw body found');
            return;
        }
        event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
    }
    catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }
    // Log webhook event
    await db.collection('webhookEvents').doc(event.id).set({
        eventId: event.id,
        eventType: event.type,
        eventData: event.data,
        processed: false,
        createdAt: admin.firestore.Timestamp.now()
    });
    try {
        // Handle the event
        switch (event.type) {
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
            case 'invoice.payment_failed':
                await handlePaymentFailed(event.data.object);
                break;
            case 'customer.subscription.trial_will_end':
                await handleTrialWillEnd(event.data.object);
                break;
            case 'customer.updated':
                await handleCustomerUpdated(event.data.object);
                break;
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
        // Mark webhook as processed
        await db.collection('webhookEvents').doc(event.id).update({
            processed: true,
            processedAt: admin.firestore.Timestamp.now()
        });
        res.json({ received: true });
    }
    catch (error) {
        console.error('Error processing webhook:', error);
        // Mark webhook as failed
        await db.collection('webhookEvents').doc(event.id).update({
            processed: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            processedAt: admin.firestore.Timestamp.now()
        });
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});
// Handle subscription created
async function handleSubscriptionCreated(subscription) {
    const customerId = subscription.customer;
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) {
        console.error('Customer was deleted');
        return;
    }
    const userId = customer.metadata.userId;
    if (!userId) {
        console.error('No userId in customer metadata');
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
    console.log(`Subscription created for user ${userId}: ${plan}`);
    // TODO: Send welcome email/notification
    await sendSubscriptionWelcomeEmail(userId, plan);
}
// Handle subscription updated
async function handleSubscriptionUpdated(subscription) {
    const customerId = subscription.customer;
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) {
        console.error('Customer was deleted');
        return;
    }
    const userId = customer.metadata.userId;
    if (!userId) {
        console.error('No userId in customer metadata');
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
    console.log(`Subscription updated for user ${userId}: ${subscription.status}`);
}
// Handle subscription deleted
async function handleSubscriptionDeleted(subscription) {
    const customerId = subscription.customer;
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) {
        console.error('Customer was deleted');
        return;
    }
    const userId = customer.metadata.userId;
    if (!userId) {
        console.error('No userId in customer metadata');
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
    console.log(`Subscription canceled for user ${userId}`);
}
// Handle payment succeeded
async function handlePaymentSucceeded(invoice) {
    if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        await handleSubscriptionUpdated(subscription);
    }
}
// Handle payment failed
async function handlePaymentFailed(invoice) {
    if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        await handleSubscriptionUpdated(subscription);
    }
}
// Handle trial ending
async function handleTrialWillEnd(subscription) {
    const customerId = subscription.customer;
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) {
        console.error('Customer was deleted');
        return;
    }
    const userId = customer.metadata.userId;
    if (!userId) {
        console.error('No userId in customer metadata');
        return;
    }
    console.log(`Trial ending for user ${userId}`);
    // TODO: Send trial ending notification
}
// Handle customer updated
async function handleCustomerUpdated(customer) {
    const userId = customer.metadata.userId;
    if (!userId) {
        console.error('No userId in customer metadata');
        return;
    }
    // Update user document
    await db.collection('users').doc(userId).update({
        'subscription.stripeCustomerId': customer.id,
        'subscription.updatedAt': admin.firestore.Timestamp.now()
    });
    console.log(`Customer updated for user ${userId}`);
}
// Helper functions
function getPlanFromPriceId(priceId) {
    const priceMap = {
        'price_free': 'free',
        'price_1RvsvqCitWuvPenEw9TefOig': 'standard', // PathGen Standard
        'price_1RvsyxCitWuvPenEOtFzt5FC': 'pro' // PathGen Pro
    };
    return priceMap[priceId] || 'free';
}
function getPlanLimits(plan) {
    const limits = {
        free: { messages: 10, tokens: 1000, dataPulls: 5, replayUploads: 2, tournamentStrategies: 3 },
        standard: { messages: 100, tokens: 10000, dataPulls: 50, replayUploads: 20, tournamentStrategies: 30 },
        pro: { messages: -1, tokens: -1, dataPulls: -1, replayUploads: -1, tournamentStrategies: -1 }
    };
    return limits[plan] || limits.free;
}
// Placeholder functions for notifications
async function sendSubscriptionWelcomeEmail(userId, plan) {
    console.log(`Welcome email sent to user ${userId} for plan ${plan}`);
    // TODO: Implement actual email sending
}
//# sourceMappingURL=stripe-webhooks.js.map