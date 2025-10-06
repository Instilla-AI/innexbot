// API Route: /api/users
// Gestione utenti

import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

// Genera ID univoco (CUID-like)
function generateId() {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `cm${timestamp}${randomStr}`;
}

export async function GET() {
  try {
    // Prova prima con created_at, poi con createdAt
    let result;
    try {
      result = await pool.query('SELECT id, email, role, created_at FROM users ORDER BY created_at DESC;');
    } catch {
      result = await pool.query('SELECT id, email, role, "createdAt" as created_at FROM users ORDER BY "createdAt" DESC;');
    }
    return NextResponse.json({ users: result.rows });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API Users GET] Error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, role } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const id = generateId();
    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();
    
    const result = await pool.query(
      'INSERT INTO users (id, email, password, role, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, role, "createdAt" as created_at;',
      [id, email, passwordHash, role || 'user', now, now]
    );
    
    return NextResponse.json({ user: result.rows[0] });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API Users POST] Error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    await pool.query('DELETE FROM users WHERE id = $1;', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API Users DELETE] Error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, role } = body;

    if (!id || !role) {
      return NextResponse.json({ error: 'User ID and role required' }, { status: 400 });
    }

    const result = await pool.query(
      'UPDATE users SET role = $1, "updatedAt" = $2 WHERE id = $3 RETURNING id, email, role;',
      [role, new Date().toISOString(), id]
    );
    return NextResponse.json({ user: result.rows[0] });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API Users PATCH] Error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
