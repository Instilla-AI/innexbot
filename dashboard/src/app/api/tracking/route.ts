// API Route: /api/tracking
// Gestione tracking metrics

import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM tracking_metrics ORDER BY weight DESC;');
    return NextResponse.json({ metrics: result.rows });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API Tracking GET] Error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventType, weight, category, instruction } = body;

    if (!eventType || !weight) {
      return NextResponse.json({ error: 'Event type and weight required' }, { status: 400 });
    }

    const result = await pool.query(
      'INSERT INTO tracking_metrics (event_type, weight, category, instruction) VALUES ($1, $2, $3, $4) ON CONFLICT (event_type) DO UPDATE SET weight = EXCLUDED.weight, category = EXCLUDED.category, instruction = EXCLUDED.instruction RETURNING *;',
      [eventType, weight, category, instruction]
    );
    return NextResponse.json({ metric: result.rows[0] });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API Tracking POST] Error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, weight, category, instruction } = body;

    if (!id || !weight) {
      return NextResponse.json({ error: 'ID and weight required' }, { status: 400 });
    }

    const result = await pool.query(
      'UPDATE tracking_metrics SET weight = $1, category = $2, instruction = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *;',
      [weight, category, instruction, parseInt(id)]
    );
    return NextResponse.json({ metric: result.rows[0] });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API Tracking PATCH] Error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Metric ID required' }, { status: 400 });
    }

    await pool.query('DELETE FROM tracking_metrics WHERE id = $1;', [parseInt(id)]);
    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API Tracking DELETE] Error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
