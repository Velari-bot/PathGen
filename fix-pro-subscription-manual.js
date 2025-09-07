// Test script to fix Pro subscription
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
if (!global.firebaseAdminInitialized) {
  try {
    initializeApp({
      credential: cert({
        projectId: 'pathgen-a771b',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    global.firebaseAdminInitialized = true;
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
  }
}

const db = getFirestore();

async function fixProSubscription(userId) {
  try {
    console.log(`🔧 COMPREHENSIVE Pro subscription fix for user: ${userId}`);

    // Step 1: Check current subscription status
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      console.error('❌ User not found');
      return;
    }

    const userData = userDoc.data();
    console.log(`📊 Current user data:`, {
      subscriptionTier: userData?.subscriptionTier,
      subscriptionStatus: userData?.subscriptionStatus,
      subscription: userData?.subscription,
      credits: userData?.credits
    });

    // Step 2: Comprehensive user document update
    const userUpdateData = {
      subscriptionTier: 'pro',
      subscriptionStatus: 'active',
      subscription: {
        status: 'active',
        tier: 'pro',
        plan: 'pro',
        startDate: new Date(),
        endDate: null,
        autoRenew: true,
        paymentMethod: 'stripe',
        stripeCustomerId: userData?.stripeCustomerId || 'manual_pro_fix',
        stripeSubscriptionId: userData?.stripeSubscriptionId || 'manual_pro_fix'
      },
      accountType: 'pro',
      updatedAt: new Date()
    };

    await db.collection('users').doc(userId).update(userUpdateData);
    console.log(`✅ Updated user document to Pro`);

    // Step 3: Update credits to Pro level (4000)
    const currentCredits = userData?.credits || 0;
    const creditsToAdd = Math.max(0, 4000 - currentCredits);
    
    if (creditsToAdd > 0) {
      await db.collection('users').doc(userId).update({
        credits: 4000,
        credits_total: 4000,
        credits_remaining: 4000 - (userData?.credits_used || 0)
      });
      console.log(`✅ Updated credits to Pro level (4000)`);
    }

    // Step 4: Update/Create usage document
    const usageSnapshot = await db.collection('usage')
      .where('userId', '==', userId)
      .get();

    const usageData = {
      userId,
      subscriptionTier: 'pro',
      totalCredits: 4000,
      usedCredits: userData?.credits_used || 0,
      availableCredits: 4000 - (userData?.credits_used || 0),
      lastReset: new Date(),
      updatedAt: new Date()
    };

    if (!usageSnapshot.empty) {
      await usageSnapshot.docs[0].ref.update(usageData);
      console.log(`✅ Updated existing usage document`);
    } else {
      await db.collection('usage').add({
        ...usageData,
        createdAt: new Date()
      });
      console.log(`✅ Created new usage document`);
    }

    // Step 5: Log the manual fix
    await db.collection('webhookLogs').add({
      eventType: 'manual_pro_fix',
      userId,
      plan: 'pro',
      status: 'active',
      timestamp: new Date(),
      success: true,
      manual: true,
      reason: 'User paid for Pro but subscription not updated',
      creditsAdded: creditsToAdd
    });

    console.log(`✅ COMPREHENSIVE Pro subscription fix completed for user ${userId}`);
    console.log(`📊 Final status: Pro subscription with ${4000 - (userData?.credits_used || 0)} credits remaining`);

  } catch (error) {
    console.error('❌ Error in comprehensive Pro subscription fix:', error);
  }
}

// Run the fix
const userId = '0IJZBQg3cDWIeDeWSWhK2IZjQ6u2';
fixProSubscription(userId).then(() => {
  console.log('🎉 Pro subscription fix completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error:', error);
  process.exit(1);
});
