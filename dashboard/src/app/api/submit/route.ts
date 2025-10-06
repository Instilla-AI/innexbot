import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('apiKey');
    const data = searchParams.get('data');
    
    if (!apiKey || apiKey !== process.env.API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Missing data parameter' }, { status: 400 });
    }

    const body = JSON.parse(decodeURIComponent(data));
    const { auditId, score, eventsChecked, isShopify } = body;

    if (!auditId || typeof score !== 'number' || !eventsChecked) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const totalEvents = eventsChecked.length;
    const eventsFound = eventsChecked.filter((e: { found: boolean }) => e.found).length;
    const eventsFailed = eventsChecked.filter((e: { found: boolean; skipped?: boolean }) => !e.found && !e.skipped).length;
    const eventsSkipped = eventsChecked.filter((e: { skipped?: boolean }) => e.skipped).length;

    // Determina platform
    const platform = isShopify ? 'shopify' : 'other';

    const result = await pool.query(
      'INSERT INTO audits (audit_id, score, total_events, events_found, events_failed, events_skipped, platform, is_shopify, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING *;',
      [auditId, score, totalEvents, eventsFound, eventsFailed, eventsSkipped, platform, isShopify || false]
    );

    return NextResponse.json({ 
      success: true,
      audit: result.rows[0]
    });
  } catch (error) {
    console.error('[API Submit] Error:', error);
    return NextResponse.json({ error: 'Failed to submit audit' }, { status: 500 });
  }
}
