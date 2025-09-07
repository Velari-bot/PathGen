import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    console.log(`🔄 Resetting usage for user: ${userId}`);
    
    const db = getDb();
    const usageRef = db.collection('usage').doc(userId);
    
    // Reset the usage to 0
    await usageRef.set({
      osirionPulls: 0,
      lastMonth: new Date().getFullYear() * 100 + new Date().getMonth() + 1,
      lastReset: new Date(),
      updatedAt: new Date()
    }, { merge: true });
    
    console.log('✅ Usage reset successfully!');
    
    return NextResponse.json({
      success: true,
      message: 'Usage reset successfully',
      userId: userId,
      resetData: {
        osirionPulls: 0,
        lastMonth: new Date().getFullYear() * 100 + new Date().getMonth() + 1,
        lastReset: new Date()
      }
    });
    
  } catch (error) {
    console.error('❌ Error resetting usage:', error);
    return NextResponse.json({ 
      error: 'Failed to reset usage',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
