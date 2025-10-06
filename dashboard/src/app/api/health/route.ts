// API Route: GET /api/health
// Health check endpoint

import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    
    return NextResponse.json({
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      status: 'unhealthy',
      error: errorMessage,
      database: 'disconnected'
    }, { status: 500 });
  }
}
