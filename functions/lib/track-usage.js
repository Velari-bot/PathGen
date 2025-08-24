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
// Track usage for a specific feature
exports.trackUsage = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = context.auth.uid;
    const { feature, tokensUsed = 0, metadata = {} } = data;
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
        const subscription = userData.subscription;
        if (!subscription) {
            throw new functions.https.HttpsError('failed-precondition', 'No subscription found');
        }
        const plan = subscription.plan || 'free';
        const limits = subscription.limits || getDefaultLimits(plan);
        const usage = subscription.usage || getDefaultUsage();
        // Check if user has exceeded limits
        const featureKey = getFeatureKey(feature);
        const currentUsage = usage[featureKey] || 0;
        const limit = limits[featureKey];
        if (limit !== -1 && currentUsage >= limit) {
            return {
                success: false,
                usageTracked: false,
                limitReached: true,
                remainingTokens: 0
            };
        }
        // Update usage
        const newUsage = currentUsage + 1;
        const newTokensUsed = (usage.tokensUsed || 0) + tokensUsed;
        await db.collection('users').doc(userId).update({
            [`subscription.usage.${featureKey}`]: newUsage,
            'subscription.usage.tokensUsed': newTokensUsed,
            'subscription.usage.updatedAt': admin.firestore.Timestamp.now()
        });
        // Log usage event
        await db.collection('usageEvents').add({
            userId,
            feature,
            tokensUsed,
            metadata,
            timestamp: admin.firestore.Timestamp.now(),
            plan
        });
        console.log(`Usage tracked for user ${userId}: ${feature} (${newUsage}/${limit})`);
        return {
            success: true,
            usageTracked: true,
            remainingTokens: limit === -1 ? -1 : Math.max(0, limit - newUsage)
        };
    }
    catch (error) {
        console.error('Error tracking usage:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
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
        const subscription = userData.subscription;
        if (!subscription) {
            return { hasSubscription: false };
        }
        const plan = subscription.plan || 'free';
        const limits = subscription.limits || getDefaultLimits(plan);
        const usage = subscription.usage || getDefaultUsage();
        return {
            hasSubscription: true,
            plan,
            limits,
            usage,
            resetDate: usage.resetDate
        };
    }
    catch (error) {
        console.error('Error getting current usage:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to get current usage');
    }
});
// Reset user usage (admin function)
exports.resetUserUsage = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const adminUserId = context.auth.uid;
    const targetUserId = data.targetUserId || adminUserId;
    try {
        // Check if admin user has permission (admin or same user)
        if (adminUserId !== targetUserId) {
            const adminDoc = await db.collection('users').doc(adminUserId).get();
            if (!adminDoc.exists) {
                throw new functions.https.HttpsError('permission-denied', 'Admin user not found');
            }
            const adminData = adminDoc.data();
            if (!(adminData === null || adminData === void 0 ? void 0 : adminData.isAdmin)) {
                throw new functions.https.HttpsError('permission-denied', 'Admin access required');
            }
        }
        // Reset usage for target user
        const defaultUsage = getDefaultUsage();
        await db.collection('users').doc(targetUserId).update({
            'subscription.usage': defaultUsage
        });
        console.log(`Usage reset for user ${targetUserId} by admin ${adminUserId}`);
        return { success: true };
    }
    catch (error) {
        console.error('Error resetting user usage:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to reset user usage');
    }
});
// Monthly usage reset (scheduled function)
exports.monthlyUsageReset = functions.pubsub.schedule('0 0 1 * *').onRun(async (context) => {
    try {
        console.log('Starting monthly usage reset...');
        // Get all users with subscriptions
        const usersSnapshot = await db.collection('users')
            .where('subscription.plan', 'in', ['standard', 'pro'])
            .get();
        const batch = db.batch();
        let resetCount = 0;
        usersSnapshot.forEach((doc) => {
            const userData = doc.data();
            if (userData.subscription) {
                const defaultUsage = getDefaultUsage();
                batch.update(doc.ref, {
                    'subscription.usage': defaultUsage
                });
                resetCount++;
            }
        });
        if (resetCount > 0) {
            await batch.commit();
            console.log(`Monthly usage reset completed for ${resetCount} users`);
        }
        else {
            console.log('No users found for monthly usage reset');
        }
    }
    catch (error) {
        console.error('Error during monthly usage reset:', error);
        throw error;
    }
});
// Helper functions
function getFeatureKey(feature) {
    const featureMap = {
        'message': 'messagesUsed',
        'data_pull': 'dataPullsUsed',
        'replay_upload': 'replayUploadsUsed',
        'tournament_strategy': 'tournamentStrategiesUsed'
    };
    return featureMap[feature] || 'messagesUsed';
}
function getDefaultLimits(plan) {
    const limits = {
        free: { messagesUsed: 10, tokensUsed: 1000, dataPullsUsed: 5, replayUploadsUsed: 2, tournamentStrategiesUsed: 3 },
        standard: { messagesUsed: 100, tokensUsed: 10000, dataPullsUsed: 50, replayUploadsUsed: 20, tournamentStrategiesUsed: 30 },
        pro: { messagesUsed: -1, tokensUsed: -1, dataPullsUsed: -1, replayUploadsUsed: -1, tournamentStrategiesUsed: -1 }
    };
    return limits[plan] || limits.free;
}
function getDefaultUsage() {
    return {
        messagesUsed: 0,
        tokensUsed: 0,
        dataPullsUsed: 0,
        replayUploadsUsed: 0,
        tournamentStrategiesUsed: 0,
        resetDate: admin.firestore.Timestamp.fromDate(new Date()),
        updatedAt: admin.firestore.Timestamp.now()
    };
}
//# sourceMappingURL=track-usage.js.map