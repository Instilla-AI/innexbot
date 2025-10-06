import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('apiKey');
    
    // Verifica API key
    if (!apiKey || apiKey !== process.env.API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Recupera le metriche attive dal database
    const result = await pool.query(
      'SELECT event_type, weight, category, instruction FROM tracking_metrics WHERE is_active = true ORDER BY weight DESC'
    );

    const config = result.rows.map(row => ({
      eventType: row.event_type,
      weight: row.weight,
      category: row.category,
      instruction: row.instruction
    }));

    return NextResponse.json({ 
      success: true,
      config 
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API Extension Config] Error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
