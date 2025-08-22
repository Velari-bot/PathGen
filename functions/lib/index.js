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
exports.moderateContent = exports.trackAnalytics = exports.fortniteApiProxy = exports.monthlyUsageReset = exports.resetUserUsage = exports.getCurrentUsage = exports.trackUsage = exports.getSubscriptionInfo = exports.createPortalSession = exports.createCheckoutSession = exports.stripeWebhook = void 0;
const functions = __importStar(require("firebase-functions"));
// Export all the functions
var stripe_webhooks_1 = require("./stripe-webhooks");
Object.defineProperty(exports, "stripeWebhook", { enumerable: true, get: function () { return stripe_webhooks_1.stripeWebhook; } });
var create_checkout_1 = require("./create-checkout");
Object.defineProperty(exports, "createCheckoutSession", { enumerable: true, get: function () { return create_checkout_1.createCheckoutSession; } });
Object.defineProperty(exports, "createPortalSession", { enumerable: true, get: function () { return create_checkout_1.createPortalSession; } });
Object.defineProperty(exports, "getSubscriptionInfo", { enumerable: true, get: function () { return create_checkout_1.getSubscriptionInfo; } });
var track_usage_1 = require("./track-usage");
Object.defineProperty(exports, "trackUsage", { enumerable: true, get: function () { return track_usage_1.trackUsage; } });
Object.defineProperty(exports, "getCurrentUsage", { enumerable: true, get: function () { return track_usage_1.getCurrentUsage; } });
Object.defineProperty(exports, "resetUserUsage", { enumerable: true, get: function () { return track_usage_1.resetUserUsage; } });
Object.defineProperty(exports, "monthlyUsageReset", { enumerable: true, get: function () { return track_usage_1.monthlyUsageReset; } });
// Legacy functions - these would need to be implemented or removed
exports.fortniteApiProxy = functions.https.onRequest((req, res) => {
    res.json({ message: 'Fortnite API proxy not implemented yet' });
});
exports.trackAnalytics = functions.https.onRequest((req, res) => {
    res.json({ message: 'Analytics tracking not implemented yet' });
});
exports.moderateContent = functions.https.onRequest((req, res) => {
    res.json({ message: 'Content moderation not implemented yet' });
});
//# sourceMappingURL=index.js.map