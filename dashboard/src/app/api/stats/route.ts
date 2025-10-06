// API Route: GET /api/stats
// Returns statistics for dashboard

import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const recentAudits = await pool.query(
      'SELECT audit_id, score, created_at, events_found, events_failed, total_events FROM audits ORDER BY created_at DESC LIMIT 10'
    );

    return NextResponse.json({
      recentAudits: recentAudits.rows.map((audit) => ({
        id: audit.audit_id,
        audit_id: audit.audit_id,
        score: audit.score,
        created_at: audit.created_at,
        events_found: audit.events_found,
        events_failed: audit.events_failed,
        total_events: audit.total_events
      }))
    });
  } catch (error) {
    console.error('[API] Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
