import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headers = Object.fromEntries(request.headers.entries());
    
    console.log('🔍 TEST WEBHOOK RECEIVED');
    console.log('📋 Headers:', JSON.stringify(headers, null, 2));
    console.log('📄 Body:', body);
    
    return NextResponse.json({ 
      received: true, 
      timestamp: new Date().toISOString(),
      message: 'Test webhook received successfully'
    });
  } catch (error) {
    console.error('❌ Test webhook error:', error);
    return NextResponse.json({ error: 'Test webhook failed' }, { status: 500 });
  }
}
