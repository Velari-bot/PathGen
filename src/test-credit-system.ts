/**
 * Credit Backend System Tests
 * Example usage and testing scenarios
 */

import { creditService } from './lib/credit-backend-service';

// Test data
const TEST_USER_ID = 'test-user-123';
const TEST_EMAIL = 'test@example.com';
const TEST_NAME = 'Test User';

/**
 * Test user initialization
 */
async function testUserInitialization() {
  console.log('🧪 Testing user initialization...');
  
  // Test Free user initialization
  const freeUserResult = await creditService.initializeUser(
    TEST_USER_ID + '-free',
    TEST_NAME,
    TEST_EMAIL,
    'free'
  );
  
  console.log('Free user result:', freeUserResult);
  
  // Test Pro user initialization
  const proUserResult = await creditService.initializeUser(
    TEST_USER_ID + '-pro',
    TEST_NAME,
    TEST_EMAIL,
    'pro',
    'sub_test123',
    'cus_test123'
  );
  
  console.log('Pro user result:', proUserResult);
}

/**
 * Test credit operations
 */
async function testCreditOperations() {
  console.log('🧪 Testing credit operations...');
  
  const userId = TEST_USER_ID + '-free';
  
  // Test credit deduction
  const deductResult = await creditService.deductCredits(
    userId,
    10,
    'ai_chat',
    { messageType: 'test' }
  );
  
  console.log('Deduct result:', deductResult);
  
  // Test credit addition
  const addResult = await creditService.addCredits(
    userId,
    50,
    'manual_topup',
    { reason: 'test topup' }
  );
  
  console.log('Add result:', addResult);
  
  // Test credit check
  const hasEnough = await creditService.hasEnoughCredits(userId, 5);
  console.log('Has enough credits for 5:', hasEnough);
  
  // Test insufficient credits
  const insufficientResult = await creditService.deductCredits(
    userId,
    1000,
    'expensive_feature'
  );
  
  console.log('Insufficient credits result:', insufficientResult);
}

/**
 * Test transaction history
 */
async function testTransactionHistory() {
  console.log('🧪 Testing transaction history...');
  
  const userId = TEST_USER_ID + '-free';
  
  const history = await creditService.getTransactionHistory(userId, 10);
  console.log('Transaction history:', history);
}

/**
 * Test Pro upgrade
 */
async function testProUpgrade() {
  console.log('🧪 Testing Pro upgrade...');
  
  const userId = TEST_USER_ID + '-free';
  
  const upgradeResult = await creditService.upgradeToPro(
    userId,
    'sub_upgrade123',
    'cus_upgrade123'
  );
  
  console.log('Upgrade result:', upgradeResult);
}

/**
 * Test subscription renewal
 */
async function testSubscriptionRenewal() {
  console.log('🧪 Testing subscription renewal...');
  
  const userId = TEST_USER_ID + '-pro';
  
  const renewalResult = await creditService.handleSubscriptionRenewal(
    userId,
    'sub_renewal123'
  );
  
  console.log('Renewal result:', renewalResult);
}

/**
 * Run all tests
 */
async function runAllTests() {
  try {
    console.log('🚀 Starting Credit Backend System Tests\n');
    
    await testUserInitialization();
    console.log('\n');
    
    await testCreditOperations();
    console.log('\n');
    
    await testTransactionHistory();
    console.log('\n');
    
    await testProUpgrade();
    console.log('\n');
    
    await testSubscriptionRenewal();
    console.log('\n');
    
    console.log('✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Export for use in other files
export {
  testUserInitialization,
  testCreditOperations,
  testTransactionHistory,
  testProUpgrade,
  testSubscriptionRenewal,
  runAllTests
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}
