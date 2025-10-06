// API Route: /api/audit
// Receives audit results from Chrome extension

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const apiKey = request.headers.get('x-api-key');
    
    if (!apiKey || apiKey !== process.env.API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.auditId || typeof body.score !== 'number' || !body.eventsChecked) {
      return NextResponse.json(
        { error: 'Missing required fields: auditId, score, eventsChecked' },
        { status: 400 }
      );
    }

    // TODO: Salvare nel database
    console.log('[AUDIT] Received:', {
      auditId: body.auditId,
      score: body.score,
      events: body.eventsChecked.length
    });

    return NextResponse.json({
      success: true,
      auditId: body.auditId,
      message: 'Audit received (not saved yet)',
      data: {
        score: body.score,
        totalEvents: body.eventsChecked.length
      }
    });

  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    endpoint: '/api/audit',
    methods: ['POST', 'GET']
  });
}
