// API Route: /api/audits
// Receives audit results from Chrome extension

import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM audits ORDER BY created_at DESC LIMIT 10;');
    return NextResponse.json({ audits: result.rows });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API Audits GET] Error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const apiKey = request.headers.get('x-api-key');
    
    if (!apiKey || apiKey !== process.env.API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Leggi come text prima
    const text = await request.text();
    
    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'Empty body' }, { status: 400 });
    }

    let body;
    try {
      body = JSON.parse(text);
    } catch (e) {
      return NextResponse.json({ 
        error: 'Invalid JSON', 
        details: e instanceof Error ? e.message : 'Unknown',
        received: text.substring(0, 100)
      }, { status: 400 });
    }
    
    const { auditId, score, eventsChecked } = body;

    if (!auditId || typeof score !== 'number' || !eventsChecked) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Calculate stats
    const totalEvents = eventsChecked.length;
    const eventsFound = eventsChecked.filter((e: { found: boolean }) => e.found).length;
    const eventsFailed = eventsChecked.filter((e: { found: boolean; skipped?: boolean }) => !e.found && !e.skipped).length;
    const eventsSkipped = eventsChecked.filter((e: { skipped?: boolean }) => e.skipped).length;

    // Insert audit
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
    console.error('[API Audits POST] Error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
