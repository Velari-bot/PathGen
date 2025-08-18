// MANUAL PRO SUBSCRIPTION FIX - Run this to update your subscription to PRO
console.log('🔧 Manual PRO subscription fix...');

// Check if Firebase is available
if (window.firebase && window.firebase.updateUserSubscription) {
  console.log('✅ Firebase found with convenience method!');
  
  // Your user ID from the terminal logs
  const userId = "40v489wKv2RwKf27owop50t9RUv1";
  
  // Update to PRO tier
  const updates = {
    subscriptionStatus: 'active',
    subscriptionTier: 'pro',
    'subscription.status': 'active',
    'subscription.tier': 'pro',
    'subscription.startDate': new Date(),
    'subscription.stripeCustomerId': 'cus_xxx', // Will be updated by webhook
    'subscription.stripeSubscriptionId': 'sub_xxx', // Will be updated by webhook
    updatedAt: new Date()
  };
  
  console.log('🔄 Updating subscription to PRO tier...');
  console.log('📊 Updates:', updates);
  
  // Update the subscription
  window.firebase.updateUserSubscription(userId, updates)
    .then((success) => {
      if (success) {
        console.log('✅ SUBSCRIPTION UPDATED TO PRO TIER!');
        console.log('🔄 Refresh your settings page to see the changes.');
        console.log('💡 You should now see PRO tier access!');
      } else {
        console.log('❌ Update failed');
      }
    })
    .catch((error) => {
      console.error('❌ Error:', error);
    });
    
} else {
  console.log('❌ Firebase not available yet');
  console.log('💡 Try refreshing the page and running this script again');
}
