import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    // Verify API key
    const apiKey = request.headers.get('x-api-key');
    
    if (!apiKey || apiKey !== process.env.API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.auditId || typeof body.score !== 'number' || !body.eventsChecked) {
      return NextResponse.json(
        { error: 'Missing required fields: auditId, score, eventsChecked' },
        { status: 400 }
      );
    }

    // Calculate statistics
    const totalEvents = body.eventsChecked.length;
    const eventsFound = body.eventsChecked.filter((e: { found: boolean }) => e.found).length;
    const eventsFailed = body.eventsChecked.filter((e: { found: boolean; skipped?: boolean }) => !e.found && !e.skipped).length;
    const eventsSkipped = body.eventsChecked.filter((e: { skipped?: boolean }) => e.skipped).length;

    // Parse duration if provided
    let durationSeconds: number | null = null;
    if (body.duration) {
      // Duration format: "3m 45s" or "45s"
      const match = body.duration.match(/(?:(\d+)m\s*)?(\d+)s/);
      if (match) {
        const minutes = parseInt(match[1] || '0');
        const seconds = parseInt(match[2] || '0');
        durationSeconds = minutes * 60 + seconds;
      }
    }

    // Create audit record
    const auditResult = await pool.query(
      `INSERT INTO audits (audit_id, extension_version, score, total_events, events_found, events_failed, events_skipped, duration_seconds, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        body.auditId,
        body.extensionVersion || '1.0.0',
        body.score,
        totalEvents,
        eventsFound,
        eventsFailed,
        eventsSkipped,
        durationSeconds,
        JSON.stringify({
          timestamp: body.timestamp || new Date().toISOString(),
          ...body.metadata
        })
      ]
    );

    const auditDbId = auditResult.rows[0].id;

    // Create event records
    for (const event of body.eventsChecked) {
      await pool.query(
        `INSERT INTO events (audit_id, event_type, found, skipped, weight, category)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          auditDbId,
          event.eventType || event.id,
          event.found,
          event.skipped || false,
          event.weight,
          event.category || null
        ]
      );
    }

    return NextResponse.json({
      success: true,
      auditId: body.auditId,
      message: 'Audit results saved successfully'
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API] Error processing audit results:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: errorMessage 
      },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    endpoint: '/api/v1/audit-results',
    methods: ['POST', 'GET', 'OPTIONS']
  });
}

// CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    },
  });
}
