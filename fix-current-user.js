// Fix script for current user ID: zvGNh8LsoXSXIZoKSaLgfC0uvXO2

console.log('🔧 Fixing Pro subscription for current user...');

const userId = "zvGNh8LsoXSXIZoKSaLgfC0uvXO2";

async function fixCurrentUserSubscription() {
  try {
    console.log('🔄 Step 1: Calling force-pro-user API...');
    
    const response = await fetch('/api/force-pro-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId })
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ Step 1 Complete: Subscription fixed!');
      console.log('📊 Result:', result);
      
      // Wait for changes to propagate
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('🔄 Step 2: Verifying subscription status...');
      
      const checkResponse = await fetch('/api/check-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });
      
      const checkResult = await checkResponse.json();
      
      if (checkResponse.ok) {
        console.log('📊 Step 2 Complete: Subscription verification:');
        console.log('   Tier:', checkResult.subscriptionTier);
        console.log('   Active:', checkResult.hasActiveSubscription);
        console.log('   Credits Remaining:', checkResult.usage?.remaining);
        
        if (checkResult.subscriptionTier === 'pro') {
          console.log('🎉 SUCCESS! Your subscription is now Pro tier!');
          console.log('💡 Please refresh the page to see all changes.');
          
          // Show success notification
          alert('✅ Subscription Fixed to Pro! Please refresh the page to see changes.');
          
        } else {
          console.log('⚠️ Subscription tier is still:', checkResult.subscriptionTier);
          console.log('🔄 May need to refresh the page or wait a moment.');
        }
      } else {
        console.error('❌ Step 2 Failed: Could not verify subscription status');
        console.error('Error:', checkResult.error);
      }
      
    } else {
      console.error('❌ Step 1 Failed: Could not fix subscription');
      console.error('Error:', result.error);
      console.error('Details:', result.details);
    }
    
  } catch (error) {
    console.error('❌ Script Error:', error);
  }
}

// Run the fix
fixCurrentUserSubscription();
