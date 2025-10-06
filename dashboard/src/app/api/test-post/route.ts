import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: Request) {
  const headers = Object.fromEntries(request.headers.entries());
  
  let bodyText = '';
  let bodyJson = null;
  
  try {
    const cloned = request.clone();
    bodyText = await cloned.text();
    if (bodyText) {
      bodyJson = JSON.parse(bodyText);
    }
  } catch {
    // ignore
  }

  return NextResponse.json({
    success: true,
    debug: {
      method: request.method,
      url: request.url,
      headers,
      bodyLength: bodyText.length,
      bodyText: bodyText.substring(0, 200),
      bodyJson,
      hasBody: !!bodyText
    }
  });
}

export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'Use POST' });
}
