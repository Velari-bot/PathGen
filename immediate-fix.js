// Immediate fix script for the browser console
// Run this in the browser console on your PathGen dashboard

console.log('🔧 Starting immediate Pro subscription fix...');

const userId = "WairbwNOc8bCy3dQNIdS1VkcyUf1";

async function immediateProFix() {
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
      
      console.log('🔄 Step 2: Verifying subscription status...');
      
      // Wait a moment for changes to propagate
      await new Promise(resolve => setTimeout(resolve, 2000));
      
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
          
          // Show success message on page if possible
          const message = document.createElement('div');
          message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #d4edda;
            color: #155724;
            padding: 15px;
            border: 1px solid #c3e6cb;
            border-radius: 5px;
            z-index: 10000;
            font-family: Arial, sans-serif;
            max-width: 300px;
          `;
          message.innerHTML = `
            <strong>✅ Subscription Fixed!</strong><br>
            Your subscription is now Pro tier.<br>
            <small>Please refresh the page.</small>
          `;
          document.body.appendChild(message);
          
          // Auto-remove message after 10 seconds
          setTimeout(() => {
            if (message.parentNode) {
              message.parentNode.removeChild(message);
            }
          }, 10000);
          
        } else {
          console.log('⚠️ Subscription tier is still:', checkResult.subscriptionTier);
          console.log('🔄 The fix may need a moment to propagate. Try refreshing the page.');
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
immediateProFix();

console.log('📝 Script loaded. Check console output above for results.');
console.log('💡 If you see success, refresh the page to see changes.');
