const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'pathgen-e5a88'
  });
}

const db = admin.firestore();

async function debugSubscription() {
  try {
    // Get recent webhook logs to see payment processing
    console.log('=== Recent Webhook Logs ===');
    const logs = await db.collection('webhookLogs')
      .orderBy('timestamp', 'desc')
      .limit(20)
      .get();
      
    logs.docs.forEach((doc, index) => {
      const data = doc.data();
      if (data.eventType && (
        data.eventType.includes('payment') || 
        data.eventType.includes('subscription') ||
        data.eventType.includes('checkout')
      )) {
        console.log(`${index + 1}. Event: ${data.eventType}`);
        console.log(`   Plan: ${data.plan || 'N/A'}`);
        console.log(`   Success: ${data.success}`);
        console.log(`   Price ID: ${data.priceId || 'N/A'}`);
        console.log(`   User ID: ${data.userId || 'N/A'}`);
        console.log(`   Timestamp: ${data.timestamp?.toDate() || 'N/A'}`);
        console.log('   ---');
      }
    });

    // Get most recent successful payment
    const successfulPayments = await db.collection('webhookLogs')
      .where('success', '==', true)
      .where('eventType', '==', 'invoice.payment_succeeded')
      .orderBy('timestamp', 'desc')
      .limit(5)
      .get();

    if (!successfulPayments.empty) {
      console.log('\n=== Most Recent Successful Payment ===');
      const payment = successfulPayments.docs[0].data();
      const userId = payment.userId;
      
      console.log('Payment Data:', {
        eventType: payment.eventType,
        plan: payment.plan,
        priceId: payment.priceId,
        userId: payment.userId,
        success: payment.success,
        timestamp: payment.timestamp?.toDate()
      });

      if (userId) {
        // Check user document
        console.log('\n=== User Document ===');
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          console.log('Subscription fields:', {
            subscriptionTier: userData.subscriptionTier,
            subscriptionStatus: userData.subscriptionStatus,
            subscription: userData.subscription,
            accountType: userData.accountType,
            tier: userData.tier
          });
        } else {
          console.log('User document not found');
        }

        // Check subscriptions collection
        console.log('\n=== Subscriptions Collection ===');
        const subsSnapshot = await db.collection('subscriptions')
          .where('userId', '==', userId)
          .get();
          
        if (!subsSnapshot.empty) {
          subsSnapshot.docs.forEach(doc => {
            const subData = doc.data();
            console.log('Subscription document:', {
              plan: subData.plan,
              status: subData.status,
              userId: subData.userId
            });
          });
        } else {
          console.log('No subscription documents found');
        }
      }
    } else {
      console.log('No successful payments found');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

debugSubscription().then(() => process.exit(0));
