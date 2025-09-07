"use strict";
/**
 * PathGen Credit Backend Service
 * Comprehensive credit tracking system for Free and Pro users
 * Handles initialization, deduction, addition, and transaction history
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.creditService = exports.CreditBackendService = void 0;
const firebase_admin_api_1 = require("./firebase-admin-api");
// Configuration constants
const CREDIT_LIMITS = {
    FREE_USER_INITIAL: 250,
    PRO_USER_INITIAL: 4000,
    MAX_TRANSACTION_HISTORY: 1000, // Keep last 1000 transactions
};
/**
 * Credit Backend Service Class
 * Handles all credit-related operations with Firebase Firestore
 */
class CreditBackendService {
    constructor() {
        this.db = (0, firebase_admin_api_1.getDb)();
        if (!this.db) {
            throw new Error('Firebase Admin not initialized');
        }
    }
    /**
     * Remove undefined values from an object to prevent Firestore errors
     */
    cleanObject(obj) {
        if (obj === null || obj === undefined) {
            return null;
        }
        if (Array.isArray(obj)) {
            return obj.map(item => this.cleanObject(item)).filter(item => item !== undefined);
        }
        if (typeof obj === 'object') {
            const cleaned = {};
            for (const [key, value] of Object.entries(obj)) {
                if (value !== undefined) {
                    cleaned[key] = this.cleanObject(value);
                }
            }
            return cleaned;
        }
        return obj;
    }
    /**
     * Initialize a new user with appropriate credits based on account type
     * @param userId - Unique user identifier
     * @param name - User's display name
     * @param email - User's email address
     * @param accountType - 'free' or 'pro'
     * @param subscriptionId - Optional Stripe subscription ID
     * @param stripeCustomerId - Optional Stripe customer ID
     * @returns Promise<CreditOperationResult>
     */
    async initializeUser(userId, name, email, accountType, subscriptionId, stripeCustomerId) {
        var _a;
        try {
            const initialCredits = accountType === 'pro'
                ? CREDIT_LIMITS.PRO_USER_INITIAL
                : CREDIT_LIMITS.FREE_USER_INITIAL;
            const userRef = this.db.collection('users').doc(userId);
            // Check if user already exists
            const existingUser = await userRef.get();
            if (existingUser.exists) {
                return {
                    success: false,
                    creditsRemaining: ((_a = existingUser.data()) === null || _a === void 0 ? void 0 : _a.credits) || 0,
                    creditsChanged: 0,
                    message: 'User already exists'
                };
            }
            // Create initial transaction record
            const initialTransaction = {
                timestamp: new Date(),
                action: 'initialization',
                creditsChanged: initialCredits,
                creditsBefore: 0,
                creditsAfter: initialCredits,
                metadata: {
                    accountType,
                    subscriptionId,
                    stripeCustomerId
                }
            };
            // Create user document
            const userDoc = {
                userId,
                name,
                email,
                accountType,
                credits: initialCredits,
                transactionHistory: [initialTransaction],
                createdAt: new Date(),
                updatedAt: new Date(),
                subscriptionId,
                stripeCustomerId
            };
            await userRef.set(userDoc);
            console.log(`✅ User ${userId} initialized with ${initialCredits} credits (${accountType})`);
            return {
                success: true,
                creditsRemaining: initialCredits,
                creditsChanged: initialCredits,
                message: `User initialized with ${initialCredits} credits`,
                transactionId: initialTransaction.timestamp.toISOString()
            };
        }
        catch (error) {
            console.error('Error initializing user:', error);
            return {
                success: false,
                creditsRemaining: 0,
                creditsChanged: 0,
                message: 'Failed to initialize user'
            };
        }
    }
    /**
     * Deduct credits from user account
     * @param userId - User identifier
     * @param amount - Amount of credits to deduct
     * @param feature - Feature/action that triggered the deduction
     * @param metadata - Additional metadata for the transaction
     * @returns Promise<CreditOperationResult>
     */
    async deductCredits(userId, amount, feature, metadata) {
        try {
            if (amount <= 0) {
                return {
                    success: false,
                    creditsRemaining: 0,
                    creditsChanged: 0,
                    message: 'Invalid deduction amount'
                };
            }
            const userRef = this.db.collection('users').doc(userId);
            return await this.db.runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists) {
                    throw new Error('User not found');
                }
                const userData = userDoc.data();
                const currentCredits = userData.credits || 0;
                // Ensure currentCredits is a valid number
                const validCurrentCredits = typeof currentCredits === 'number' ? currentCredits : 0;
                // Check if user has enough credits
                if (validCurrentCredits < amount) {
                    return {
                        success: false,
                        creditsRemaining: validCurrentCredits,
                        creditsChanged: 0,
                        message: `Insufficient credits. Required: ${amount}, Available: ${validCurrentCredits}`
                    };
                }
                const newCredits = validCurrentCredits - amount;
                // Create transaction record
                const transactionRecord = {
                    timestamp: new Date(),
                    action: 'deduction',
                    creditsChanged: -amount,
                    creditsBefore: validCurrentCredits,
                    creditsAfter: newCredits,
                    metadata: this.cleanObject(Object.assign({ feature }, metadata))
                };
                // Update user document
                const existingTransactionHistory = Array.isArray(userData.transactionHistory)
                    ? userData.transactionHistory
                    : [];
                const updatedTransactionHistory = [
                    ...existingTransactionHistory,
                    this.cleanObject(transactionRecord)
                ].slice(-CREDIT_LIMITS.MAX_TRANSACTION_HISTORY); // Keep only recent transactions
                transaction.update(userRef, this.cleanObject({
                    credits: newCredits,
                    transactionHistory: updatedTransactionHistory,
                    updatedAt: new Date()
                }));
                console.log(`✅ Deducted ${amount} credits from user ${userId} for ${feature}. Remaining: ${newCredits}`);
                return {
                    success: true,
                    creditsRemaining: newCredits,
                    creditsChanged: -amount,
                    message: `Successfully deducted ${amount} credits`,
                    transactionId: transactionRecord.timestamp.toISOString()
                };
            });
        }
        catch (error) {
            console.error('Error deducting credits:', error);
            return {
                success: false,
                creditsRemaining: 0,
                creditsChanged: 0,
                message: 'Failed to deduct credits'
            };
        }
    }
    /**
     * Add credits to user account
     * @param userId - User identifier
     * @param amount - Amount of credits to add
     * @param action - Type of addition (manual_topup, subscription_upgrade, etc.)
     * @param metadata - Additional metadata for the transaction
     * @returns Promise<CreditOperationResult>
     */
    async addCredits(userId, amount, action = 'addition', metadata) {
        try {
            if (amount <= 0) {
                return {
                    success: false,
                    creditsRemaining: 0,
                    creditsChanged: 0,
                    message: 'Invalid addition amount'
                };
            }
            const userRef = this.db.collection('users').doc(userId);
            return await this.db.runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists) {
                    throw new Error('User not found');
                }
                const userData = userDoc.data();
                const currentCredits = userData.credits || 0;
                // Ensure currentCredits is a valid number
                const validCurrentCredits = typeof currentCredits === 'number' ? currentCredits : 0;
                const newCredits = validCurrentCredits + amount;
                // Create transaction record
                const transactionRecord = {
                    timestamp: new Date(),
                    action,
                    creditsChanged: amount,
                    creditsBefore: validCurrentCredits,
                    creditsAfter: newCredits,
                    metadata: this.cleanObject(metadata)
                };
                // Update user document
                const existingTransactionHistory = Array.isArray(userData.transactionHistory)
                    ? userData.transactionHistory
                    : [];
                const updatedTransactionHistory = [
                    ...existingTransactionHistory,
                    this.cleanObject(transactionRecord)
                ].slice(-CREDIT_LIMITS.MAX_TRANSACTION_HISTORY);
                transaction.update(userRef, this.cleanObject({
                    credits: newCredits,
                    transactionHistory: updatedTransactionHistory,
                    updatedAt: new Date()
                }));
                console.log(`✅ Added ${amount} credits to user ${userId}. New balance: ${newCredits}`);
                return {
                    success: true,
                    creditsRemaining: newCredits,
                    creditsChanged: amount,
                    message: `Successfully added ${amount} credits`,
                    transactionId: transactionRecord.timestamp.toISOString()
                };
            });
        }
        catch (error) {
            console.error('Error adding credits:', error);
            return {
                success: false,
                creditsRemaining: 0,
                creditsChanged: 0,
                message: 'Failed to add credits'
            };
        }
    }
    /**
     * Check if user has enough credits for an action
     * @param userId - User identifier
     * @param requiredAmount - Required credits for the action
     * @returns Promise<boolean>
     */
    async hasEnoughCredits(userId, requiredAmount) {
        try {
            const userRef = this.db.collection('users').doc(userId);
            const userDoc = await userRef.get();
            if (!userDoc.exists) {
                return false;
            }
            const userData = userDoc.data();
            return userData.credits >= requiredAmount;
        }
        catch (error) {
            console.error('Error checking credits:', error);
            return false;
        }
    }
    /**
     * Get user's current credit balance and account type
     * @param userId - User identifier
     * @returns Promise<UserDocument | null>
     */
    async getUserCredits(userId) {
        try {
            const userRef = this.db.collection('users').doc(userId);
            const userDoc = await userRef.get();
            if (!userDoc.exists) {
                return null;
            }
            return userDoc.data();
        }
        catch (error) {
            console.error('Error getting user credits:', error);
            return null;
        }
    }
    /**
     * Get user's transaction history
     * @param userId - User identifier
     * @param limit - Maximum number of transactions to return (default: 50)
     * @returns Promise<TransactionRecord[]>
     */
    async getTransactionHistory(userId, limit = 50) {
        try {
            const userRef = this.db.collection('users').doc(userId);
            const userDoc = await userRef.get();
            if (!userDoc.exists) {
                return [];
            }
            const userData = userDoc.data();
            const transactionHistory = Array.isArray(userData.transactionHistory)
                ? userData.transactionHistory
                : [];
            return transactionHistory
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .slice(0, limit);
        }
        catch (error) {
            console.error('Error getting transaction history:', error);
            return [];
        }
    }
    /**
     * Upgrade user from Free to Pro and top up credits to 4000 if needed
     * @param userId - User identifier
     * @param subscriptionId - Stripe subscription ID
     * @param stripeCustomerId - Stripe customer ID
     * @returns Promise<CreditOperationResult>
     */
    async upgradeToPro(userId, subscriptionId, stripeCustomerId) {
        try {
            const userRef = this.db.collection('users').doc(userId);
            return await this.db.runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists) {
                    throw new Error('User not found');
                }
                const userData = userDoc.data();
                const currentCredits = userData.credits || 0;
                // Ensure currentCredits is a valid number
                const validCurrentCredits = typeof currentCredits === 'number' ? currentCredits : 0;
                // Calculate credits needed to reach 4000
                const creditsToAdd = Math.max(0, CREDIT_LIMITS.PRO_USER_INITIAL - validCurrentCredits);
                // Create upgrade transaction record
                const upgradeTransaction = {
                    timestamp: new Date(),
                    action: 'subscription_upgrade',
                    creditsChanged: creditsToAdd,
                    creditsBefore: validCurrentCredits,
                    creditsAfter: validCurrentCredits + creditsToAdd,
                    metadata: this.cleanObject({
                        subscriptionId,
                        stripeCustomerId,
                        previousAccountType: userData.accountType,
                        newAccountType: 'pro'
                    })
                };
                // Update user document
                const existingTransactionHistory = Array.isArray(userData.transactionHistory)
                    ? userData.transactionHistory
                    : [];
                const updatedTransactionHistory = [
                    ...existingTransactionHistory,
                    this.cleanObject(upgradeTransaction)
                ].slice(-CREDIT_LIMITS.MAX_TRANSACTION_HISTORY);
                transaction.update(userRef, this.cleanObject({
                    accountType: 'pro',
                    credits: validCurrentCredits + creditsToAdd,
                    subscriptionId,
                    stripeCustomerId,
                    transactionHistory: updatedTransactionHistory,
                    updatedAt: new Date()
                }));
                console.log(`✅ User ${userId} upgraded to Pro. Credits topped up to ${validCurrentCredits + creditsToAdd}`);
                return {
                    success: true,
                    creditsRemaining: validCurrentCredits + creditsToAdd,
                    creditsChanged: creditsToAdd,
                    message: `Successfully upgraded to Pro and topped up to ${validCurrentCredits + creditsToAdd} credits`,
                    transactionId: upgradeTransaction.timestamp.toISOString()
                };
            });
        }
        catch (error) {
            console.error('Error upgrading user to Pro:', error);
            return {
                success: false,
                creditsRemaining: 0,
                creditsChanged: 0,
                message: 'Failed to upgrade user to Pro'
            };
        }
    }
    /**
     * Handle subscription renewal - add monthly credits
     * @param userId - User identifier
     * @param subscriptionId - Stripe subscription ID
     * @returns Promise<CreditOperationResult>
     */
    async handleSubscriptionRenewal(userId, subscriptionId) {
        try {
            const userRef = this.db.collection('users').doc(userId);
            const userDoc = await userRef.get();
            if (!userDoc.exists) {
                return {
                    success: false,
                    creditsRemaining: 0,
                    creditsChanged: 0,
                    message: 'User not found'
                };
            }
            const userData = userDoc.data();
            if (userData.accountType !== 'pro') {
                return {
                    success: false,
                    creditsRemaining: userData.credits,
                    creditsChanged: 0,
                    message: 'User is not a Pro subscriber'
                };
            }
            // Add monthly Pro credits (4000)
            return await this.addCredits(userId, CREDIT_LIMITS.PRO_USER_INITIAL, 'subscription_renewal', { subscriptionId });
        }
        catch (error) {
            console.error('Error handling subscription renewal:', error);
            return {
                success: false,
                creditsRemaining: 0,
                creditsChanged: 0,
                message: 'Failed to process subscription renewal'
            };
        }
    }
}
exports.CreditBackendService = CreditBackendService;
// Export singleton instance
exports.creditService = new CreditBackendService();
//# sourceMappingURL=credit-backend-service.js.map