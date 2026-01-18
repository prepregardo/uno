import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import dotenv from 'dotenv';
import { query } from './db/connection.js';
import type { DashboardData, MarginStats } from '../shared/types.js';

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
app.get('/api/dashboard', (req, res) => {
  try {
    // Получаем общую статистику
    const [stats] = query<{
      total_sports: number;
      total_events: number;
      total_markets: number;
    }>(`
      SELECT
        (SELECT COUNT(*) FROM sports WHERE is_active = 1) as total_sports,
        (SELECT COUNT(*) FROM events) as total_events,
        (SELECT COUNT(*) FROM markets) as total_markets
    `);

    // Получаем статистику по видам спорта
    const sports = query<{
      id: number;
      name: string;
      events_count: number;
      markets_count: number;
      avg_margin: number;
    }>(`
      SELECT * FROM sport_stats LIMIT 20
    `);

    // Получаем статистику маржи по типам рынков
    const marginByType = query<{
      market_type: string;
      avg_margin: number;
      sample_size: number;
    }>(`
      SELECT
        type as market_type,
        ROUND(AVG(margin), 2) as avg_margin,
        COUNT(*) as sample_size
      FROM markets
      WHERE margin IS NOT NULL
      GROUP BY type
      ORDER BY avg_margin
    `);

    // Последние сессии парсинга
    const recentSessions = query<{
      id: number;
      started_at: string;
      completed_at: string;
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
    const [lastUpdate] = query<{ last_updated: string }>(`
      SELECT MAX(last_updated) as last_updated FROM sports
    `);

    const dashboard: DashboardData = {
      lastUpdate: lastUpdate?.last_updated ? new Date(lastUpdate.last_updated) : new Date(),
      totalSports: stats?.total_sports || 0,
      totalEvents: stats?.total_events || 0,
      totalMarkets: stats?.total_markets || 0,
      sports: sports.map((s) => ({
        id: s.id,
        name: s.name,
        eventsCount: s.events_count,
        marketsCount: s.markets_count,
        avgMargin: s.avg_margin || 0,
      })),
      marginByType: marginByType.map((m) => ({
        marketType: m.market_type as any,
        avgMargin: m.avg_margin || 0,
        sampleSize: m.sample_size,
      })),
      recentSessions: recentSessions.map((s) => ({
        id: s.id,
        startedAt: new Date(s.started_at),
        completedAt: s.completed_at ? new Date(s.completed_at) : undefined,
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
app.get('/api/sports/:id', (req, res) => {
  try {
    const sportId = parseInt(req.params.id, 10);

    const [sport] = query<any>(`
      SELECT * FROM sports WHERE id = ?
    `, [sportId]);

    if (!sport) {
      return res.status(404).json({ error: 'Sport not found' });
    }

    // Турниры
    const tournaments = query<any>(`
      SELECT * FROM tournaments WHERE sport_id = ?
      ORDER BY events_count DESC
      LIMIT 50
    `, [sportId]);

    // События для турниров
    const tournamentsWithEvents = tournaments.map(t => {
      const events = query<any>(`
        SELECT * FROM events WHERE tournament_id = ?
        ORDER BY start_time
        LIMIT 20
      `, [t.id]);

      return { ...t, events };
    });

    // Статистика маржи
    const marginStats = query<MarginStats>(`
      SELECT * FROM margin_history
      WHERE sport_id = ?
      ORDER BY collected_at DESC
      LIMIT 100
    `, [sportId]);

    res.json({
      sport,
      tournaments: tournamentsWithEvents,
      marginStats,
    });
  } catch (error) {
    console.error('Sport detail error:', error);
    res.status(500).json({ error: 'Failed to fetch sport details' });
  }
});

// Детали события с рынками
app.get('/api/events/:id', (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);

    const [event] = query<any>(`
      SELECT e.*, s.name as sport_name, t.name as tournament_name
      FROM events e
      LEFT JOIN sports s ON e.sport_id = s.id
      LEFT JOIN tournaments t ON e.tournament_id = t.id
      WHERE e.id = ?
    `, [eventId]);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Рынки
    const markets = query<any>(`
      SELECT * FROM markets WHERE event_id = ?
      ORDER BY name
    `, [eventId]);

    // Добавляем исходы к каждому рынку
    const marketsWithOutcomes = markets.map(m => {
      const outcomes = query<any>(`
        SELECT * FROM outcomes WHERE market_id = ?
      `, [m.id]);

      return { ...m, outcomes };
    });

    res.json({ event, markets: marketsWithOutcomes });
  } catch (error) {
    console.error('Event detail error:', error);
    res.status(500).json({ error: 'Failed to fetch event details' });
  }
});

// История маржи для графиков
app.get('/api/margin-history', (req, res) => {
  try {
    const sportId = req.query.sportId ? parseInt(req.query.sportId as string, 10) : null;
    const marketType = req.query.marketType as string || null;
    const days = parseInt(req.query.days as string, 10) || 7;

    let sql = `SELECT * FROM margin_history WHERE collected_at > datetime('now', '-${days} days')`;
    const params: any[] = [];

    if (sportId) {
      sql += ` AND sport_id = ?`;
      params.push(sportId);
    }

    if (marketType) {
      sql += ` AND market_type = ?`;
      params.push(marketType);
    }

    sql += ` ORDER BY collected_at ASC`;

    const history = query<MarginStats>(sql, params);
    res.json(history);
  } catch (error) {
    console.error('Margin history error:', error);
    res.status(500).json({ error: 'Failed to fetch margin history' });
  }
});

// Запуск парсера вручную
app.post('/api/scrape', async (req, res) => {
  try {
    const { spawn } = await import('child_process');
    const child = spawn('npx', ['tsx', 'src/backend/scraper/run.ts'], {
      cwd: process.cwd(),
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
      cwd: process.cwd(),
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
