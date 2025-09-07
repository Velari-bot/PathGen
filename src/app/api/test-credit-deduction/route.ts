import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { userId, amount = 10, action = 'test_deduction' } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    console.log(`🧪 Testing credit deduction for user: ${userId}, amount: ${amount}`);
    
    // Dynamic import to avoid build-time issues
    const { CreditBackendService } = await import('@/lib/credit-backend-service');
    const creditService = new CreditBackendService();
    
    const result = await creditService.deductCredits(
      userId,
      amount,
      action,
      {
        testRun: true,
        timestamp: new Date().toISOString(),
        source: 'test_api'
      }
    );
    
    console.log('🧪 Test credit deduction result:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Credit deduction test completed',
      result: result
    });
    
  } catch (error) {
    console.error('❌ Error testing credit deduction:', error);
    return NextResponse.json({ 
      error: 'Failed to test credit deduction',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
