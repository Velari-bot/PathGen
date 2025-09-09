// Script to fix subscription for user WairbwNOc8bCy3dQNIdS1VkcyUf1

const userId = "WairbwNOc8bCy3dQNIdS1VkcyUf1";

// Function to call the API endpoint directly
async function fixUserSubscription() {
  try {
    console.log('🔧 Fixing subscription for user:', userId);
    
    // Make API call to comprehensive fix endpoint
    const response = await fetch('/api/comprehensive-pro-fix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Subscription fix successful:', result);
      
      // Also call the subscription check to verify
      const checkResponse = await fetch('/api/check-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });
      
      if (checkResponse.ok) {
        const checkResult = await checkResponse.json();
        console.log('📊 Subscription status after fix:', {
          tier: checkResult.subscriptionTier,
          hasActive: checkResult.hasActiveSubscription,
          limits: checkResult.limits
        });
      }
      
    } else {
      const error = await response.json();
      console.error('❌ Fix failed:', error);
    }
    
  } catch (error) {
    console.error('❌ Error fixing subscription:', error);
  }
}

// Run the fix
fixUserSubscription();
