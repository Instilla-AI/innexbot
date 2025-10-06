// API Route: GET /api/db-check
// Verifica struttura database

import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // Check tables
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `;
    const tables = await pool.query(tablesQuery);

    // Check users
    const usersQuery = `SELECT COUNT(*) as count FROM users;`;
    const usersCount = await pool.query(usersQuery);

    // Check tracking_metrics
    const metricsQuery = `SELECT COUNT(*) as count FROM tracking_metrics;`;
    const metricsCount = await pool.query(metricsQuery);

    // Check audits
    const auditsQuery = `SELECT COUNT(*) as count FROM audits;`;
    const auditsCount = await pool.query(auditsQuery);

    return NextResponse.json({
      status: 'ok',
      tables: tables.rows.map(r => r.table_name),
      counts: {
        users: parseInt(usersCount.rows[0].count),
        tracking_metrics: parseInt(metricsCount.rows[0].count),
        audits: parseInt(auditsCount.rows[0].count),
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      status: 'error',
      error: errorMessage 
    }, { status: 500 });
  }
}
