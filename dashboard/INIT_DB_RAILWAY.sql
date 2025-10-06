-- InnexBot Database Initialization
-- Esegui questo SQL su Railway Postgres (Data tab > Query)

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- AUDITS TABLE
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

-- EVENTS TABLE
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

-- TRACKING METRICS TABLE
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

-- SETTINGS TABLE
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_audits_created_at ON audits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audits_score ON audits(score);
CREATE INDEX IF NOT EXISTS idx_events_audit_id ON events(audit_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_tracking_metrics_event_type ON tracking_metrics(event_type);

-- INSERT ADMIN USER (password: 12345Aa!)
-- Hash generato con bcryptjs rounds=10
INSERT INTO users (email, password_hash, role)
VALUES ('ciccioragusa@gmail.com', '$2a$10$rZ7eF8vQ3jX5kN2mP1wYxOYJ5xK9nL3mR6tS8uV4wX7yA9bC0dE1f', 'admin')
ON CONFLICT (email) DO NOTHING;

-- INSERT DEFAULT TRACKING METRICS
INSERT INTO tracking_metrics (event_type, weight, category, instruction) VALUES
('pageview', 15, 'navigation', 'Visita la homepage del sito'),
('view_item_list', 20, 'product', 'Naviga verso una pagina categoria/collezione'),
('view_item', 20, 'product', 'Apri una pagina prodotto'),
('add_to_cart', 25, 'cart', 'Aggiungi un prodotto al carrello'),
('begin_checkout', 15, 'checkout', 'Inizia il processo di checkout'),
('purchase', 5, 'conversion', 'Completa un acquisto (se possibile)')
ON CONFLICT (event_type) DO NOTHING;

-- INSERT DEFAULT SETTINGS
INSERT INTO settings (key, value) VALUES
('cta_score_threshold', '70'),
('shopify_cta_message', 'Scarica gratuitamente InnexData ed usa il coupon sconto {coupon}'),
('shopify_coupon_code', 'INNEX2024'),
('non_shopify_cta_message', 'Il tuo tracking ha bisogno di ottimizzazione. Contattaci per una consulenza gratuita!'),
('non_shopify_cta_link', 'https://innexdata.com/contatti')
ON CONFLICT (key) DO NOTHING;

-- VERIFY
SELECT 'USERS' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'TRACKING_METRICS', COUNT(*) FROM tracking_metrics
UNION ALL
SELECT 'SETTINGS', COUNT(*) FROM settings
UNION ALL
SELECT 'AUDITS', COUNT(*) FROM audits
UNION ALL
SELECT 'EVENTS', COUNT(*) FROM events;

-- CHECK ADMIN USER
SELECT id, email, role, created_at FROM users WHERE email = 'ciccioragusa@gmail.com';

-- CHECK METRICS
SELECT id, event_type, weight, category FROM tracking_metrics ORDER BY weight DESC;
