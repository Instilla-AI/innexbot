import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const allParams = Object.fromEntries(searchParams.entries());
  
  console.log('[TEST] Received GET request:', allParams);
  
  return NextResponse.json({
    success: true,
    message: 'Request received',
    params: allParams,
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: Request) {
  const body = await request.text();
  
  console.log('[TEST] Received POST request:', body);
  
  return NextResponse.json({
    success: true,
    message: 'Request received',
    body,
    timestamp: new Date().toISOString()
  });
}
