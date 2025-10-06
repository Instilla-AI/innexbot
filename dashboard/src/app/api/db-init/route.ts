// API Route: POST /api/db-init
// Inizializza database manualmente

import { NextResponse } from 'next/server';
import { Client } from 'pg';
import bcrypt from 'bcryptjs';

export async function POST() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();

    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS audits (
        id SERIAL PRIMARY KEY,
        audit_id VARCHAR(255) UNIQUE NOT NULL,
        extension_version VARCHAR(50),
        score INTEGER NOT NULL,
        total_events INTEGER NOT NULL,
        events_found INTEGER NOT NULL,
        events_failed INTEGER NOT NULL,
        events_skipped INTEGER NOT NULL,
        duration_seconds INTEGER,
        platform VARCHAR(50) DEFAULT 'other',
        is_shopify BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        audit_id VARCHAR(255) REFERENCES audits(audit_id) ON DELETE CASCADE,
        event_type VARCHAR(100) NOT NULL,
        found BOOLEAN NOT NULL,
        skipped BOOLEAN DEFAULT FALSE,
        weight INTEGER NOT NULL,
        category VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tracking_metrics (
        id SERIAL PRIMARY KEY,
        event_type VARCHAR(100) UNIQUE NOT NULL,
        weight INTEGER NOT NULL,
        category VARCHAR(50),
        instruction TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_audits_created_at ON audits(created_at DESC);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_events_audit_id ON events(audit_id);');

    // Insert admin
    const hash = await bcrypt.hash('12345Aa!', 10);
    await client.query(
      `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING;`,
      ['ciccioragusa@gmail.com', hash, 'admin']
    );

    // Insert metrics
    const metrics = [
      ['pageview', 15, 'navigation', 'Visita la homepage del sito'],
      ['view_item_list', 20, 'product', 'Naviga verso una pagina categoria/collezione'],
      ['view_item', 20, 'product', 'Apri una pagina prodotto'],
      ['add_to_cart', 25, 'cart', 'Aggiungi un prodotto al carrello'],
      ['begin_checkout', 15, 'checkout', 'Inizia il processo di checkout'],
      ['purchase', 5, 'conversion', 'Completa un acquisto (se possibile)']
    ];

    for (const [event_type, weight, category, instruction] of metrics) {
      await client.query(
        `INSERT INTO tracking_metrics (event_type, weight, category, instruction) VALUES ($1, $2, $3, $4) ON CONFLICT (event_type) DO NOTHING;`,
        [event_type, weight, category, instruction]
      );
    }

    // Insert default settings
    const settings = [
      ['cta_score_threshold', '70'],
      ['shopify_cta_message', 'Scarica gratuitamente InnexData ed usa il coupon sconto {coupon}'],
      ['shopify_coupon_code', 'INNEX2024'],
      ['non_shopify_cta_message', 'Il tuo tracking ha bisogno di ottimizzazione. Contattaci per una consulenza gratuita!'],
      ['non_shopify_cta_link', 'https://innexdata.com/contatti']
    ];

    for (const [key, value] of settings) {
      await client.query(
        `INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING;`,
        [key, value]
      );
    }

    // Verify
    const users = await client.query('SELECT COUNT(*) FROM users;');
    const metricsCount = await client.query('SELECT COUNT(*) FROM tracking_metrics;');
    const settingsCount = await client.query('SELECT COUNT(*) FROM settings;');

    await client.end();

    return NextResponse.json({ 
      status: 'success',
      message: 'Database initialized successfully',
      data: {
        users: parseInt(users.rows[0].count),
        metrics: parseInt(metricsCount.rows[0].count),
        settings: parseInt(settingsCount.rows[0].count)
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await client.end();
    return NextResponse.json({ 
      status: 'error',
      error: errorMessage 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to initialize database',
    endpoint: '/api/db-init'
  });
}
