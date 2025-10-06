import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // Verifica schema tabella users
    const schema = await pool.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    // Conta utenti
    const count = await pool.query('SELECT COUNT(*) FROM users;');

    // Prova a vedere un utente
    const sample = await pool.query('SELECT * FROM users LIMIT 1;');

    return NextResponse.json({
      schema: schema.rows,
      count: count.rows[0].count,
      sample: sample.rows[0] || null
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
