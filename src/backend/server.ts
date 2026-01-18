import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import dotenv from 'dotenv';
import { query } from './db/connection.js';
import type { DashboardData, SportDetail, MarginStats } from '../shared/types.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Dashboard data
app.get('/api/dashboard', async (req, res) => {
  try {
    // Получаем общую статистику
    const [stats] = await query<{
      total_sports: string;
      total_events: string;
      total_markets: string;
    }>(`
      SELECT
        (SELECT COUNT(*) FROM sports WHERE is_active = true) as total_sports,
        (SELECT COUNT(*) FROM events) as total_events,
        (SELECT COUNT(*) FROM markets) as total_markets
    `);

    // Получаем статистику по видам спорта
    const sports = await query<{
      id: number;
      name: string;
      events_count: number;
      markets_count: number;
      avg_margin: number;
    }>(`
      SELECT * FROM sport_stats LIMIT 20
    `);

    // Получаем статистику маржи по типам рынков
    const marginByType = await query<{
      market_type: string;
      avg_margin: number;
      sample_size: number;
    }>(`
      SELECT
        type as market_type,
        ROUND(AVG(margin)::numeric, 2) as avg_margin,
        COUNT(*) as sample_size
      FROM markets
      WHERE margin IS NOT NULL
      GROUP BY type
      ORDER BY avg_margin
    `);

    // Последние сессии парсинга
    const recentSessions = await query<{
      id: number;
      started_at: Date;
      completed_at: Date;
      status: string;
      sports_count: number;
      events_count: number;
      markets_count: number;
    }>(`
      SELECT * FROM scrape_sessions
      ORDER BY started_at DESC
      LIMIT 10
    `);

    // Последнее обновление
    const [lastUpdate] = await query<{ last_updated: Date }>(`
      SELECT MAX(last_updated) as last_updated FROM sports
    `);

    const dashboard: DashboardData = {
      lastUpdate: lastUpdate?.last_updated || new Date(),
      totalSports: parseInt(stats?.total_sports || '0', 10),
      totalEvents: parseInt(stats?.total_events || '0', 10),
      totalMarkets: parseInt(stats?.total_markets || '0', 10),
      sports: sports.map((s) => ({
        id: s.id,
        name: s.name,
        eventsCount: s.events_count,
        marketsCount: s.markets_count,
        avgMargin: s.avg_margin || 0,
      })),
      marginByType: marginByType.map((m) => ({
        marketType: m.market_type as any,
        avgMargin: m.avg_margin,
        sampleSize: parseInt(String(m.sample_size), 10),
      })),
      recentSessions: recentSessions.map((s) => ({
        id: s.id,
        startedAt: s.started_at,
        completedAt: s.completed_at,
        status: s.status as 'running' | 'completed' | 'failed',
        sportsCount: s.sports_count,
        eventsCount: s.events_count,
        marketsCount: s.markets_count,
      })),
    };

    res.json(dashboard);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Детали по виду спорта
app.get('/api/sports/:id', async (req, res) => {
  try {
    const sportId = parseInt(req.params.id, 10);

    const [sport] = await query<any>(`
      SELECT * FROM sports WHERE id = $1
    `, [sportId]);

    if (!sport) {
      return res.status(404).json({ error: 'Sport not found' });
    }

    // Турниры с событиями
    const tournaments = await query<any>(`
      SELECT
        t.id,
        t.external_id,
        t.name,
        t.country,
        t.events_count,
        json_agg(
          json_build_object(
            'id', e.id,
            'name', e.name,
            'homeTeam', e.home_team,
            'awayTeam', e.away_team,
            'startTime', e.start_time,
            'isLive', e.is_live,
            'marketsCount', e.markets_count
          )
        ) FILTER (WHERE e.id IS NOT NULL) as events
      FROM tournaments t
      LEFT JOIN events e ON e.tournament_id = t.id
      WHERE t.sport_id = $1
      GROUP BY t.id
      ORDER BY t.events_count DESC
      LIMIT 50
    `, [sportId]);

    // Статистика маржи
    const marginStats = await query<MarginStats>(`
      SELECT * FROM margin_history
      WHERE sport_id = $1
      ORDER BY collected_at DESC
      LIMIT 100
    `, [sportId]);

    res.json({
      sport,
      tournaments,
      marginStats,
    });
  } catch (error) {
    console.error('Sport detail error:', error);
    res.status(500).json({ error: 'Failed to fetch sport details' });
  }
});

// Детали события с рынками
app.get('/api/events/:id', async (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);

    const [event] = await query<any>(`
      SELECT e.*, s.name as sport_name, t.name as tournament_name
      FROM events e
      LEFT JOIN sports s ON e.sport_id = s.id
      LEFT JOIN tournaments t ON e.tournament_id = t.id
      WHERE e.id = $1
    `, [eventId]);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Рынки с исходами
    const markets = await query<any>(`
      SELECT
        m.id,
        m.name,
        m.type,
        m.margin,
        json_agg(
          json_build_object(
            'id', o.id,
            'name', o.name,
            'odds', o.odds,
            'probability', o.probability
          )
        ) as outcomes
      FROM markets m
      LEFT JOIN outcomes o ON o.market_id = m.id
      WHERE m.event_id = $1
      GROUP BY m.id
      ORDER BY m.name
    `, [eventId]);

    res.json({ event, markets });
  } catch (error) {
    console.error('Event detail error:', error);
    res.status(500).json({ error: 'Failed to fetch event details' });
  }
});

// История маржи для графиков
app.get('/api/margin-history', async (req, res) => {
  try {
    const sportId = req.query.sportId ? parseInt(req.query.sportId as string, 10) : null;
    const marketType = req.query.marketType as string || null;
    const days = parseInt(req.query.days as string, 10) || 7;

    let whereClause = `WHERE collected_at > NOW() - INTERVAL '${days} days'`;
    const params: any[] = [];

    if (sportId) {
      params.push(sportId);
      whereClause += ` AND sport_id = $${params.length}`;
    }

    if (marketType) {
      params.push(marketType);
      whereClause += ` AND market_type = $${params.length}`;
    }

    const history = await query<MarginStats>(`
      SELECT * FROM margin_history
      ${whereClause}
      ORDER BY collected_at ASC
    `, params);

    res.json(history);
  } catch (error) {
    console.error('Margin history error:', error);
    res.status(500).json({ error: 'Failed to fetch margin history' });
  }
});

// Запуск парсера вручную
app.post('/api/scrape', async (req, res) => {
  try {
    // Запускаем парсер в отдельном процессе
    const { spawn } = await import('child_process');
    const child = spawn('npx', ['tsx', 'src/backend/scraper/run.ts'], {
      detached: true,
      stdio: 'ignore',
    });
    child.unref();

    res.json({ message: 'Scraping started', pid: child.pid });
  } catch (error) {
    console.error('Scrape trigger error:', error);
    res.status(500).json({ error: 'Failed to start scraping' });
  }
});

// Настройка cron job для автоматического парсинга
const scrapeIntervalHours = parseInt(process.env.SCRAPE_INTERVAL_HOURS || '1', 10);
console.log(`⏰ Scheduling scraper to run every ${scrapeIntervalHours} hour(s)`);

cron.schedule(`0 */${scrapeIntervalHours} * * *`, async () => {
  console.log('🔄 Running scheduled scrape...');
  try {
    const { spawn } = await import('child_process');
    spawn('npx', ['tsx', 'src/backend/scraper/run.ts'], {
      stdio: 'inherit',
    });
  } catch (error) {
    console.error('Scheduled scrape failed:', error);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard API: http://localhost:${PORT}/api/dashboard`);
});
