import { CreditBackendService } from './src/lib/credit-backend-service';

async function testCreditDeduction() {
  console.log('🧪 Testing credit deduction system...');
  
  const creditService = new CreditBackendService();
  const userId = '0IJZBQg3cDWIeDeWSWhK2IZjQ6u2';
  
  try {
    const result = await creditService.deductCredits(
      userId,
      10,
      'test_stat_lookup',
      {
        testRun: true,
        timestamp: new Date().toISOString(),
        source: 'test_script'
      }
    );
    
    console.log('✅ Credit deduction test result:', result);
    
    if (result.success) {
      console.log(`✅ Successfully deducted ${result.creditsChanged} credits`);
      console.log(`💰 Credits remaining: ${result.creditsRemaining}`);
    } else {
      console.log(`❌ Failed to deduct credits: ${result.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing credit deduction:', error);
  }
}

testCreditDeduction();
