import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const apiKey = request.headers.get('x-api-key');
    
    if (!apiKey || apiKey !== process.env.API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Leggi come FormData invece di JSON
    const formData = await request.formData();
    const dataString = formData.get('data') as string;
    
    if (!dataString) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    const body = JSON.parse(dataString);
    const { auditId, score, eventsChecked } = body;

    if (!auditId || typeof score !== 'number' || !eventsChecked) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const totalEvents = eventsChecked.length;
    const eventsFound = eventsChecked.filter((e: { found: boolean }) => e.found).length;
    const eventsFailed = eventsChecked.filter((e: { found: boolean; skipped?: boolean }) => !e.found && !e.skipped).length;
    const eventsSkipped = eventsChecked.filter((e: { skipped?: boolean }) => e.skipped).length;

    const result = await pool.query(
      'INSERT INTO audits (audit_id, score, total_events, events_found, events_failed, events_skipped, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *;',
      [auditId, score, totalEvents, eventsFound, eventsFailed, eventsSkipped]
    );

    return NextResponse.json({ 
      success: true,
      audit: result.rows[0]
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API Audit Submit] Error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    message: 'Use POST with FormData',
    example: 'FormData with field "data" containing JSON string'
  });
}
