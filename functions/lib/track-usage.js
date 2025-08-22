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
Object.defineProperty(exports, "__esModule", { value: true });
exports.monthlyUsageReset = exports.resetUserUsage = exports.getCurrentUsage = exports.trackUsage = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
// Track usage for subscription features
exports.trackUsage = functions.https.onCall(async (data, context) => {
    var _a;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = context.auth.uid;
    const { feature, tokensUsed = 0, metadata = {} } = data;
    try {
        // Validate feature type
        const validFeatures = ['message', 'data_pull', 'replay_upload', 'tournament_strategy'];
        if (!validFeatures.includes(feature)) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid feature type');
        }
        // Get user subscription
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User not found');
        }
        const userData = userDoc.data();
        const subscription = userData === null || userData === void 0 ? void 0 : userData.subscription;
        const currentUsage = (userData === null || userData === void 0 ? void 0 : userData.usage) || {};
        // Check if user has subscription
        if (!subscription || subscription.status === 'free' || subscription.status === 'canceled') {
            // For free users, check basic limits
            const freeLimits = getPlanLimits('free');
            const featureKey = `${feature}Used`;
            const limitKey = `monthly${feature.charAt(0).toUpperCase() + feature.slice(1)}`;
            if (currentUsage[featureKey] >= freeLimits[limitKey]) {
                return {
                    success: false,
                    usageTracked: false,
                    limitReached: true,
                    message: `Free tier limit reached for ${feature}. Upgrade to continue.`
                };
            }
        }
        else if (subscription.status === 'past_due') {
            // For past due users, allow usage but warn
            console.log(`User ${userId} is past due but using feature ${feature}`);
        }
        else {
            // For paid users, check subscription limits
            const subscriptionDoc = await db.collection('subscriptions')
                .where('userId', '==', userId)
                .limit(1)
                .get();
            if (!subscriptionDoc.empty) {
                const subData = subscriptionDoc.docs[0].data();
                const limits = subData.limits;
                const usage = subData.usage;
                const featureKey = `${feature}Used`;
                const limitKey = `monthly${feature.charAt(0).toUpperCase() + feature.slice(1)}`;
                if (usage[featureKey] >= limits[limitKey]) {
                    return {
                        success: false,
                        usageTracked: false,
                        limitReached: true,
                        message: `Monthly limit reached for ${feature}. Reset on next billing cycle.`
                    };
                }
            }
        }
        // Calculate remaining tokens
        let remainingTokens = 0;
        if (subscription && subscription.tier !== 'free') {
            const planLimits = getPlanLimits(subscription.tier);
            remainingTokens = planLimits.monthlyTokens - (currentUsage.tokensUsed || 0);
        }
        else {
            const freeLimits = getPlanLimits('free');
            remainingTokens = freeLimits.monthlyTokens - (currentUsage.tokensUsed || 0);
        }
        // Log usage
        await db.collection('usageLogs').doc().set({
            userId,
            timestamp: admin.firestore.Timestamp.now(),
            requestType: feature,
            tokensUsed: tokensUsed || 0,
            cost: 0, // TODO: Calculate actual cost
            details: {
                success: true,
                metadata: metadata || {}
            },
            subscriptionTier: ((_a = userData === null || userData === void 0 ? void 0 : userData.subscription) === null || _a === void 0 ? void 0 : _a.plan) || 'free',
            remainingTokens: remainingTokens
        });
        // Update user usage counters
        const updateData = {};
        updateData[`usage.${feature}Used`] = admin.firestore.FieldValue.increment(1);
        if (tokensUsed > 0) {
            updateData['usage.tokensUsed'] = admin.firestore.FieldValue.increment(tokensUsed);
        }
        updateData['usage.lastUpdated'] = admin.firestore.Timestamp.now();
        await db.collection('users').doc(userId).update(updateData);
        // Update subscription usage if applicable
        if (subscription === null || subscription === void 0 ? void 0 : subscription.stripeSubscriptionId) {
            const subscriptionRef = db.collection('subscriptions')
                .where('userId', '==', userId)
                .limit(1);
            const subSnapshot = await subscriptionRef.get();
            if (!subSnapshot.empty) {
                const subUpdateData = {};
                subUpdateData[`usage.${feature}Used`] = admin.firestore.FieldValue.increment(1);
                if (tokensUsed > 0) {
                    subUpdateData['usage.tokensUsed'] = admin.firestore.FieldValue.increment(tokensUsed);
                }
                subUpdateData['updatedAt'] = admin.firestore.Timestamp.now();
                await subSnapshot.docs[0].ref.update(subUpdateData);
            }
        }
        // Track analytics
        await trackAnalytics(userId, feature, metadata);
        const response = {
            success: true,
            usageTracked: true,
            remainingTokens: Math.max(0, remainingTokens)
        };
        console.log(`Usage tracked for user ${userId}, feature ${feature}`);
        return response;
    }
    catch (error) {
        console.error('Error tracking usage:', error);
        throw new functions.https.HttpsError('internal', 'Failed to track usage');
    }
});
// Get current usage for a user
exports.getCurrentUsage = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = context.auth.uid;
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
        const subscription = userData === null || userData === void 0 ? void 0 : userData.subscription;
        const usage = (userData === null || userData === void 0 ? void 0 : userData.usage) || {};
        // Get plan limits
        const planLimits = getPlanLimits((subscription === null || subscription === void 0 ? void 0 : subscription.tier) || 'free');
        // Calculate usage percentages
        const usagePercentages = {
            messages: Math.round((usage.messagesUsed || 0) / planLimits.monthlyMessages * 100),
            tokens: Math.round((usage.tokensUsed || 0) / planLimits.monthlyTokens * 100),
            dataPulls: Math.round((usage.dataPullsUsed || 0) / planLimits.monthlyDataPulls * 100),
            replayUploads: Math.round((usage.replayUploadsUsed || 0) / planLimits.replayUploads * 100),
            tournamentStrategies: Math.round((usage.tournamentStrategiesUsed || 0) / planLimits.tournamentStrategies * 100)
        };
        // Get reset date
        const resetDate = usage.resetDate || new Date();
        const now = new Date();
        const daysUntilReset = Math.ceil((resetDate.toDate().getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return {
            usage,
            limits: planLimits,
            percentages: usagePercentages,
            daysUntilReset: Math.max(0, daysUntilReset),
            subscriptionTier: (subscription === null || subscription === void 0 ? void 0 : subscription.tier) || 'free',
            subscriptionStatus: (subscription === null || subscription === void 0 ? void 0 : subscription.status) || 'free'
        };
    }
    catch (error) {
        console.error('Error getting current usage:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get usage information');
    }
});
// Reset usage for a user (admin function)
exports.resetUserUsage = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = context.auth.uid;
    const { targetUserId } = data;
    try {
        // Check if user is admin (implement your admin check logic)
        const isAdmin = await checkIfAdmin(userId);
        if (!isAdmin) {
            throw new functions.https.HttpsError('permission-denied', 'Admin access required');
        }
        const resetTargetUserId = targetUserId || userId;
        // Reset user usage
        const resetData = {
            'usage.messagesUsed': 0,
            'usage.tokensUsed': 0,
            'usage.dataPullsUsed': 0,
            'usage.replayUploadsUsed': 0,
            'usage.tournamentStrategiesUsed': 0,
            'usage.resetDate': admin.firestore.Timestamp.now(),
            'usage.lastUpdated': admin.firestore.Timestamp.now()
        };
        await db.collection('users').doc(resetTargetUserId).update(resetData);
        // Reset subscription usage if applicable
        const subscriptionDoc = await db.collection('subscriptions')
            .where('userId', '==', resetTargetUserId)
            .limit(1)
            .get();
        if (!subscriptionDoc.empty) {
            await subscriptionDoc.docs[0].ref.update({
                'usage.messagesUsed': 0,
                'usage.tokensUsed': 0,
                'usage.dataPullsUsed': 0,
                'usage.replayUploadsUsed': 0,
                'usage.tournamentStrategiesUsed': 0,
                'usage.resetDate': admin.firestore.Timestamp.now(),
                'updatedAt': admin.firestore.Timestamp.now()
            });
        }
        console.log(`Usage reset for user ${resetTargetUserId} by admin ${userId}`);
        return { success: true, message: 'Usage reset successfully' };
    }
    catch (error) {
        console.error('Error resetting usage:', error);
        throw new functions.https.HttpsError('internal', 'Failed to reset usage');
    }
});
// Monthly usage reset function (runs on the 1st of every month)
exports.monthlyUsageReset = functions.pubsub.schedule('0 0 1 * *').onRun(async (context) => {
    try {
        const subscriptionsRef = db.collection('subscriptions');
        const snapshot = await subscriptionsRef.get();
        const batch = db.batch();
        const now = admin.firestore.Timestamp.now();
        snapshot.docs.forEach((doc) => {
            batch.update(doc.ref, {
                'usage.messagesUsed': 0,
                'usage.tokensUsed': 0,
                'usage.dataPullsUsed': 0,
                'usage.replayUploadsUsed': 0,
                'usage.tournamentStrategiesUsed': 0,
                'usage.resetDate': now,
                updatedAt: now
            });
        });
        await batch.commit();
        console.log(`Reset usage for ${snapshot.size} subscriptions`);
        // Also reset free user usage
        const usersRef = db.collection('users');
        const usersSnapshot = await usersRef.where('subscription.tier', '==', 'free').get();
        const userBatch = db.batch();
        usersSnapshot.docs.forEach((doc) => {
            userBatch.update(doc.ref, {
                'usage.messagesUsed': 0,
                'usage.tokensUsed': 0,
                'usage.dataPullsUsed': 0,
                'usage.replayUploadsUsed': 0,
                'usage.tournamentStrategiesUsed': 0,
                'usage.resetDate': now,
                'usage.lastUpdated': now
            });
        });
        await userBatch.commit();
        console.log(`Reset usage for ${usersSnapshot.size} free users`);
    }
    catch (error) {
        console.error('Error resetting monthly usage:', error);
    }
});
// Track analytics for feature usage
async function trackAnalytics(userId, feature, metadata) {
    try {
        const today = new Date().toISOString().split('T')[0];
        const analyticsRef = db.collection('analytics').doc('featureUsage').collection('features').doc(feature);
        await analyticsRef.set({
            [userId]: {
                lastUsed: admin.firestore.Timestamp.now(),
                usageCount: admin.firestore.FieldValue.increment(1),
                metadata
            }
        }, { merge: true });
        // Track daily active user
        const dauRef = db.collection('analytics').doc('dailyActiveUsers').collection('dates').doc(today);
        await dauRef.set({
            [userId]: admin.firestore.Timestamp.now()
        }, { merge: true });
    }
    catch (error) {
        console.error('Error tracking analytics:', error);
    }
}
// Check if user is admin (implement your admin check logic)
async function checkIfAdmin(userId) {
    var _a;
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            // Implement your admin check logic here
            return (userData === null || userData === void 0 ? void 0 : userData.role) === 'admin' || ((_a = userData === null || userData === void 0 ? void 0 : userData.subscription) === null || _a === void 0 ? void 0 : _a.tier) === 'pro';
        }
        return false;
    }
    catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}
// Helper function to get plan limits
function getPlanLimits(plan) {
    const limits = {
        free: { messages: 10, tokens: 1000, dataPulls: 5, replayUploads: 2, tournamentStrategies: 3 },
        standard: { messages: 100, tokens: 10000, dataPulls: 50, replayUploads: 20, tournamentStrategies: 30 },
        pro: { messages: -1, tokens: -1, dataPulls: -1, replayUploads: -1, tournamentStrategies: -1 }
    };
    return limits[plan] || limits.free;
}
//# sourceMappingURL=track-usage.js.map