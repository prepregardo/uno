import { sql } from '@vercel/postgres';

// Типы данных
export interface Sport {
  id: number;
  external_id: string;
  name: string;
  slug: string;
  events_count: number;
  markets_count: number;
  is_active: boolean;
  last_updated: string;
}

export interface MarginByType {
  market_type: string;
  avg_margin: number;
  sample_size: number;
}

export interface ScrapeSession {
  id: number;
  started_at: string;
  completed_at: string | null;
  status: 'running' | 'completed' | 'failed';
  sports_count: number;
  events_count: number;
  markets_count: number;
}

export interface DashboardData {
  lastUpdate: string;
  totalSports: number;
  totalEvents: number;
  totalMarkets: number;
  sports: Array<{
    id: number;
    name: string;
    eventsCount: number;
    marketsCount: number;
    avgMargin: number;
  }>;
  marginByType: Array<{
    marketType: string;
    avgMargin: number;
    sampleSize: number;
  }>;
  recentSessions: ScrapeSession[];
}

// Функции для работы с БД
export async function getDashboardData(): Promise<DashboardData> {
  try {
    // Получаем статистику
    const statsResult = await sql`
      SELECT
        (SELECT COUNT(*) FROM sports WHERE is_active = true) as total_sports,
        (SELECT COUNT(*) FROM events) as total_events,
        (SELECT COUNT(*) FROM markets) as total_markets
    `;
    const stats = statsResult.rows[0] || { total_sports: 0, total_events: 0, total_markets: 0 };

    // Получаем виды спорта
    const sportsResult = await sql`
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
        ) as avg_margin
      FROM sports s
      WHERE s.is_active = true
      ORDER BY s.events_count DESC
      LIMIT 20
    `;

    // Получаем маржу по типам рынков
    const marginResult = await sql`
      SELECT
        type as market_type,
        ROUND(AVG(margin)::numeric, 2) as avg_margin,
        COUNT(*) as sample_size
      FROM markets
      WHERE margin IS NOT NULL
      GROUP BY type
      ORDER BY avg_margin
    `;

    // Получаем последние сессии
    const sessionsResult = await sql`
      SELECT * FROM scrape_sessions
      ORDER BY started_at DESC
      LIMIT 10
    `;

    // Последнее обновление
    const lastUpdateResult = await sql`
      SELECT MAX(last_updated) as last_updated FROM sports
    `;

    return {
      lastUpdate: lastUpdateResult.rows[0]?.last_updated || new Date().toISOString(),
      totalSports: Number(stats.total_sports) || 0,
      totalEvents: Number(stats.total_events) || 0,
      totalMarkets: Number(stats.total_markets) || 0,
      sports: sportsResult.rows.map((s: any) => ({
        id: s.id,
        name: s.name,
        eventsCount: Number(s.events_count) || 0,
        marketsCount: Number(s.markets_count) || 0,
        avgMargin: Number(s.avg_margin) || 0,
      })),
      marginByType: marginResult.rows.map((m: any) => ({
        marketType: m.market_type,
        avgMargin: Number(m.avg_margin) || 0,
        sampleSize: Number(m.sample_size) || 0,
      })),
      recentSessions: sessionsResult.rows as ScrapeSession[],
    };
  } catch (error) {
    console.error('Database error:', error);
    // Возвращаем пустые данные если БД не настроена
    return {
      lastUpdate: new Date().toISOString(),
      totalSports: 0,
      totalEvents: 0,
      totalMarkets: 0,
      sports: [],
      marginByType: [],
      recentSessions: [],
    };
  }
}

// Инициализация таблиц
export async function initDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS scrape_sessions (
      id SERIAL PRIMARY KEY,
      started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      completed_at TIMESTAMP WITH TIME ZONE,
      status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
      sports_count INTEGER DEFAULT 0,
      events_count INTEGER DEFAULT 0,
      markets_count INTEGER DEFAULT 0,
      error_message TEXT
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sports (
      id SERIAL PRIMARY KEY,
      external_id VARCHAR(100) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255),
      events_count INTEGER DEFAULT 0,
      markets_count INTEGER DEFAULT 0,
      icon_url TEXT,
      is_active BOOLEAN DEFAULT true,
      last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS tournaments (
      id SERIAL PRIMARY KEY,
      external_id VARCHAR(100) UNIQUE NOT NULL,
      sport_id INTEGER REFERENCES sports(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      country VARCHAR(100),
      events_count INTEGER DEFAULT 0,
      last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      external_id VARCHAR(100) UNIQUE NOT NULL,
      sport_id INTEGER REFERENCES sports(id) ON DELETE CASCADE,
      tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
      name VARCHAR(500) NOT NULL,
      home_team VARCHAR(255),
      away_team VARCHAR(255),
      start_time TIMESTAMP WITH TIME ZONE,
      is_live BOOLEAN DEFAULT false,
      markets_count INTEGER DEFAULT 0,
      last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS markets (
      id SERIAL PRIMARY KEY,
      external_id VARCHAR(100) NOT NULL,
      event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL,
      margin DECIMAL(5, 2),
      last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(external_id, event_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS outcomes (
      id SERIAL PRIMARY KEY,
      external_id VARCHAR(100) NOT NULL,
      market_id INTEGER REFERENCES markets(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      odds DECIMAL(10, 2) NOT NULL,
      probability DECIMAL(5, 4),
      UNIQUE(external_id, market_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS margin_history (
      id SERIAL PRIMARY KEY,
      sport_id INTEGER REFERENCES sports(id) ON DELETE CASCADE,
      sport_name VARCHAR(255) NOT NULL,
      market_type VARCHAR(50) NOT NULL,
      avg_margin DECIMAL(5, 2) NOT NULL,
      min_margin DECIMAL(5, 2),
      max_margin DECIMAL(5, 2),
      sample_size INTEGER NOT NULL,
      collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;

  // Создаём индексы
  await sql`CREATE INDEX IF NOT EXISTS idx_sports_active ON sports(is_active)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_events_sport ON events(sport_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_markets_event ON markets(event_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_markets_type ON markets(type)`;

  // Таблица для CMS контента
  await sql`
    CREATE TABLE IF NOT EXISTS cms_content (
      id SERIAL PRIMARY KEY,
      key VARCHAR(100) UNIQUE NOT NULL,
      value JSONB NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;
}

// CMS функции
export async function getContent(key: string): Promise<any | null> {
  try {
    const result = await sql`
      SELECT value FROM cms_content WHERE key = ${key}
    `;
    return result.rows[0]?.value || null;
  } catch (error) {
    console.error('Failed to get content:', error);
    return null;
  }
}

export async function setContent(key: string, value: any): Promise<boolean> {
  try {
    await sql`
      INSERT INTO cms_content (key, value, updated_at)
      VALUES (${key}, ${JSON.stringify(value)}, NOW())
      ON CONFLICT (key)
      DO UPDATE SET value = ${JSON.stringify(value)}, updated_at = NOW()
    `;
    return true;
  } catch (error) {
    console.error('Failed to set content:', error);
    return false;
  }
}

export async function getAllCmsContent(): Promise<{ bookmaker: any; sports: any[] } | null> {
  try {
    const bookmaker = await getContent('bookmaker');
    const sports = await getContent('sports');

    if (!bookmaker && !sports) {
      return null;
    }

    return {
      bookmaker: bookmaker || null,
      sports: sports || [],
    };
  } catch (error) {
    console.error('Failed to get CMS content:', error);
    return null;
  }
}
