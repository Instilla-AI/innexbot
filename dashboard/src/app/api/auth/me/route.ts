// API Route: GET /api/auth/me
// Verifica sessione utente

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token');

    if (!authToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Trova utente dal token (che è l'ID)
    const result = await pool.query('SELECT id, email, role, "createdAt" as created_at FROM users WHERE id = $1;', [authToken.value]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    return NextResponse.json({ user: result.rows[0] });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API Auth Me] Error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
