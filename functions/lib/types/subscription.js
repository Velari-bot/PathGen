"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STRIPE_PRICE_IDS = exports.PLAN_LIMITS = void 0;
exports.getPlanFromPriceId = getPlanFromPriceId;
exports.getPlanLimits = getPlanLimits;
// Plan Configuration
exports.PLAN_LIMITS = {
    free: {
        monthlyMessages: 10,
        monthlyTokens: 1000,
        monthlyDataPulls: 5,
        replayUploads: 0,
        tournamentStrategies: 0,
        prioritySupport: false,
        advancedAnalytics: false
    },
    pro: {
        monthlyMessages: 1000,
        monthlyTokens: 100000,
        monthlyDataPulls: 500,
        replayUploads: 50,
        tournamentStrategies: 100,
        prioritySupport: true,
        advancedAnalytics: true
    }
};
// Stripe Price IDs - UPDATE THESE WITH YOUR ACTUAL STRIPE PRICE IDs
exports.STRIPE_PRICE_IDS = {
    free: 'free', // Free plan (no actual Stripe price needed)
    pro: 'price_1RvsvqCitWuvPenEw9TefOig' // PathGen Pro
};
// Helper function to get plan from Stripe price ID
function getPlanFromPriceId(priceId) {
    const planMap = {
        'free': 'free',
        'price_1RvsvqCitWuvPenEw9TefOig': 'pro'
    };
    return planMap[priceId] || 'free';
}
// Helper function to get plan limits
function getPlanLimits(plan) {
    return exports.PLAN_LIMITS[plan] || exports.PLAN_LIMITS.free;
}
//# sourceMappingURL=subscription.js.map