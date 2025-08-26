import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    message: 'Stripe webhook endpoint is ready for production',
    endpoint: '/api/stripe',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  
  return NextResponse.json({
    status: 'ok',
    message: 'Test webhook received',
    bodyLength: body.length,
    headers: Object.fromEntries(request.headers.entries()),
    timestamp: new Date().toISOString()
  });
}
