import * as functions from 'firebase-functions';

// Export all the functions
export { stripeWebhook } from './stripe-webhooks';
export { createCheckoutSession, createPortalSession, getSubscriptionInfo } from './create-checkout';
export { trackUsage, getCurrentUsage, resetUserUsage, monthlyUsageReset } from './track-usage';

// Legacy functions - these would need to be implemented or removed
export const fortniteApiProxy = functions.https.onRequest((req, res) => {
  res.json({ message: 'Fortnite API proxy not implemented yet' });
});

export const trackAnalytics = functions.https.onRequest((req, res) => {
  res.json({ message: 'Analytics tracking not implemented yet' });
});

export const moderateContent = functions.https.onRequest((req, res) => {
  res.json({ message: 'Content moderation not implemented yet' });
});
