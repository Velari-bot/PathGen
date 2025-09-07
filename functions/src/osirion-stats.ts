import { onRequest } from 'firebase-functions/v2/https';
import { getDb } from './firebase-admin';
import { CreditBackendService } from './credit-backend-service';
import { OsirionService } from './osirion';

export const osirionStats = onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { epicId, platform = 'pc', lookupType = 'recent', userId } = req.body;

    if (!epicId || !userId) {
      res.status(400).json({ error: 'Epic ID and User ID are required' });
      return;
    }

    console.log(`🔍 Processing ${lookupType} stats lookup for Epic ID: ${epicId}, User: ${userId}`);

    const db = getDb();
    const creditService = new CreditBackendService();
    const osirionService = new OsirionService();

    // Determine credit cost and action type based on lookup type
    const creditCost = lookupType === 'full' ? 50 : 10;
    const actionType = lookupType === 'full' ? 'osirion_pull' : 'stat_lookup';
    const matchLimit = lookupType === 'full' ? 25 : 10;

    // Check user's subscription and usage limits
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const userData = userDoc.data();
    const subscriptionTier = userData?.subscriptionTier || 'free';
    
    // Get monthly usage limits
    const monthlyLimits = {
      free: 6,
      pro: -1, // unlimited
      premium: -1 // unlimited
    };
    
    const monthlyLimit = monthlyLimits[subscriptionTier as keyof typeof monthlyLimits] || 6;
    
    // Check current usage
    const usageRef = db.collection('usage').doc(userId);
    const usageDoc = await usageRef.get();
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    
    let currentPulls = 0;
    if (usageDoc.exists) {
      const usageData = usageDoc.data();
      if (usageData?.lastMonth === currentMonth) {
        currentPulls = usageData.osirionPulls || 0;
      }
    }

    // TEMPORARY: Reset usage for specific user (remove this after testing)
    let updatedPulls = currentPulls;
    if (userId === '0IJZBQg3cDWIeDeWSWhK2IZjQ6u2' && currentPulls >= monthlyLimit) {
      console.log('🔄 TEMPORARY: Resetting usage for testing user');
      await usageRef.set({
        lastMonth: currentMonth,
        osirionPulls: 0,
        lastReset: new Date()
      }, { merge: true });
      updatedPulls = 0;
    }
    
    // Check if user has reached their monthly limit (skip check for unlimited users)
    if (monthlyLimit !== -1 && updatedPulls >= monthlyLimit) {
      console.log(`❌ Monthly limit reached: ${currentPulls}/${monthlyLimit} pulls used (${subscriptionTier} tier)`);
      res.status(429).json({
        success: false,
        blocked: true,
        message: 'Monthly limit reached',
        error: `You have used all ${monthlyLimit} monthly Osirion pulls for your ${subscriptionTier} tier`,
        currentUsage: currentPulls,
        limit: monthlyLimit,
        subscriptionTier: subscriptionTier,
        suggestion: 'Wait until next month or upgrade your plan for more pulls',
        fallback: {
          manualCheckUrl: `https://osirion.gg/profile/${epicId}`,
          instructions: [
            `Monthly limit reached (${monthlyLimit} pulls) - please check your stats manually on Osirion`,
            'You can still view cached stats if available',
            'Limit resets at the beginning of each month'
          ]
        }
      });
      return;
    }

    // Deduct credits
    console.log(`💰 Deducting ${creditCost} credits for ${actionType}`);
    const creditResult = await creditService.deductCredits(
      userId,
      creditCost,
      actionType,
      {
        epicId,
        platform,
        lookupType,
        matchLimit
      }
    );

    if (!creditResult.success) {
      console.log(`❌ Failed to deduct credits: ${creditResult.message}`);
      res.status(400).json({
        success: false,
        error: 'Failed to deduct credits',
        details: creditResult.message
      });
      return;
    }

    console.log(`✅ Credits deducted successfully: ${creditResult.creditsChanged}`);

    // Fetch stats from Osirion
    console.log(`🔍 Fetching ${lookupType} stats from Osirion (limit: ${matchLimit})`);
    const osirionData = await osirionService.getPlayerStats(epicId, platform, matchLimit);

    if (!osirionData) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch data from Osirion'
      });
      return;
    }

    // Save stats to Firebase
    const statsRef = db.collection('fortniteStats').doc(userId);
    await statsRef.set({
      epicId,
      platform,
      stats: osirionData,
      lastUpdated: new Date(),
      lookupType,
      matchLimit
    }, { merge: true });

    // Update usage count
    await usageRef.set({
      lastMonth: currentMonth,
      osirionPulls: updatedPulls + 1,
      lastReset: new Date()
    }, { merge: true });

    console.log(`✅ ${lookupType} stats saved successfully`);

    res.status(200).json({
      success: true,
      data: osirionData,
      usage: {
        currentPulls: updatedPulls + 1,
        monthlyLimit: monthlyLimit,
        subscriptionTier: subscriptionTier
      },
      monthlyLimit: {
        limit: monthlyLimit,
        used: updatedPulls + 1,
        remaining: monthlyLimit === -1 ? -1 : Math.max(0, monthlyLimit - (updatedPulls + 1))
      }
    });

  } catch (error) {
    console.error('❌ Error in osirionStats function:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
