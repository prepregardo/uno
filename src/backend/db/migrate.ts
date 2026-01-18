import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Создаём папку для БД если её нет
const dataDir = join(process.cwd(), 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(dataDir, 'winline.db');
const db = new Database(dbPath);

console.log('🔄 Starting database migration...');

try {
  // Таблицы
  db.exec(`
    CREATE TABLE IF NOT EXISTS scrape_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT,
      status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
      sports_count INTEGER DEFAULT 0,
      events_count INTEGER DEFAULT 0,
      markets_count INTEGER DEFAULT 0,
      error_message TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS sports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      external_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      slug TEXT,
      events_count INTEGER DEFAULT 0,
      markets_count INTEGER DEFAULT 0,
      icon_url TEXT,
      is_active INTEGER DEFAULT 1,
      last_updated TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS tournaments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      external_id TEXT UNIQUE NOT NULL,
      sport_id INTEGER REFERENCES sports(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      country TEXT,
      events_count INTEGER DEFAULT 0,
      last_updated TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      external_id TEXT UNIQUE NOT NULL,
      sport_id INTEGER REFERENCES sports(id) ON DELETE CASCADE,
      tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      home_team TEXT,
      away_team TEXT,
      start_time TEXT,
      is_live INTEGER DEFAULT 0,
      markets_count INTEGER DEFAULT 0,
      last_updated TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS markets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      external_id TEXT NOT NULL,
      event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      margin REAL,
      last_updated TEXT DEFAULT (datetime('now')),
      UNIQUE(external_id, event_id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS outcomes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      external_id TEXT NOT NULL,
      market_id INTEGER REFERENCES markets(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      odds REAL NOT NULL,
      probability REAL,
      UNIQUE(external_id, market_id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS margin_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sport_id INTEGER REFERENCES sports(id) ON DELETE CASCADE,
      sport_name TEXT NOT NULL,
      market_type TEXT NOT NULL,
      avg_margin REAL NOT NULL,
      min_margin REAL,
      max_margin REAL,
      sample_size INTEGER NOT NULL,
      collected_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Индексы
  db.exec(`CREATE INDEX IF NOT EXISTS idx_sports_active ON sports(is_active)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_events_sport ON events(sport_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_events_tournament ON events(tournament_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_events_live ON events(is_live)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_markets_event ON markets(event_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_markets_type ON markets(type)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_outcomes_market ON outcomes(market_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_margin_history_sport ON margin_history(sport_id)`);

  // Views
  db.exec(`DROP VIEW IF EXISTS sport_stats`);
  db.exec(`
    CREATE VIEW sport_stats AS
    SELECT
      s.id,
      s.name,
      s.events_count,
      s.markets_count,
      COALESCE(
        (SELECT AVG(m.margin)
         FROM markets m
         JOIN events e ON m.event_id = e.id
         WHERE e.sport_id = s.id AND m.margin IS NOT NULL),
        0
      ) as avg_margin,
      s.last_updated
    FROM sports s
    WHERE s.is_active = 1
    ORDER BY s.events_count DESC
  `);

  console.log('✅ Database migration completed successfully!');
  console.log(`📁 Database location: ${dbPath}`);

} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
} finally {
  db.close();
}
