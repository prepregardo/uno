import { parser } from './parser.js';
import { query, run, getLastInsertId, transaction } from '../db/connection.js';
import { calculateMarginStatistics } from './margin.js';
import type { MarketType } from '../../shared/types.js';

function saveToDatabase(
  sports: Awaited<ReturnType<typeof parser.scrapeAll>>['sports'],
  marginStats: Map<MarketType, number[]>
) {
  return transaction(() => {
    // Создаём сессию парсинга
    run(`INSERT INTO scrape_sessions (status) VALUES (?)`, ['running']);
    const sessionId = getLastInsertId();

    let totalEvents = 0;
    let totalMarkets = 0;

    for (const sport of sports) {
      // Upsert спорта
      run(
        `INSERT INTO sports (external_id, name, slug, events_count, is_active, last_updated)
         VALUES (?, ?, ?, ?, 1, datetime('now'))
         ON CONFLICT (external_id) DO UPDATE SET
           name = excluded.name,
           events_count = excluded.events_count,
           last_updated = datetime('now')`,
        [sport.id, sport.name, sport.id, sport.events.length]
      );

      const [sportRow] = query<{ id: number }>(
        `SELECT id FROM sports WHERE external_id = ?`,
        [sport.id]
      );
      const sportDbId = sportRow.id;

      // Сохраняем события
      for (const event of sport.events) {
        // Upsert турнира
        let tournamentDbId: number | null = null;
        if (event.tournamentId) {
          run(
            `INSERT INTO tournaments (external_id, sport_id, name, events_count, last_updated)
             VALUES (?, ?, ?, 1, datetime('now'))
             ON CONFLICT (external_id) DO UPDATE SET
               name = excluded.name,
               last_updated = datetime('now')`,
            [event.tournamentId, sportDbId, event.tournamentName || 'Unknown']
          );

          const [tournamentRow] = query<{ id: number }>(
            `SELECT id FROM tournaments WHERE external_id = ?`,
            [event.tournamentId]
          );
          tournamentDbId = tournamentRow?.id || null;
        }

        // Upsert события
        run(
          `INSERT INTO events (external_id, sport_id, tournament_id, name, home_team, away_team, start_time, is_live, last_updated)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
           ON CONFLICT (external_id) DO UPDATE SET
             name = excluded.name,
             home_team = excluded.home_team,
             away_team = excluded.away_team,
             is_live = excluded.is_live,
             last_updated = datetime('now')`,
          [
            event.id,
            sportDbId,
            tournamentDbId,
            event.name,
            event.homeTeam,
            event.awayTeam,
            event.startTime || null,
            event.isLive ? 1 : 0,
          ]
        );

        const [eventRow] = query<{ id: number }>(
          `SELECT id FROM events WHERE external_id = ?`,
          [event.id]
        );
        const eventDbId = eventRow.id;
        totalEvents++;

        // Сохраняем рынки
        const markets = sport.markets.get(event.id) || [];
        for (const market of markets) {
          const odds = market.outcomes.map((o) => o.odds);
          const margin =
            odds.length > 0
              ? (odds.reduce((sum, o) => sum + 1 / o, 0) - 1) * 100
              : null;

          run(
            `INSERT INTO markets (external_id, event_id, name, type, margin, last_updated)
             VALUES (?, ?, ?, ?, ?, datetime('now'))
             ON CONFLICT (external_id, event_id) DO UPDATE SET
               name = excluded.name,
               margin = excluded.margin,
               last_updated = datetime('now')`,
            [market.id, eventDbId, market.name, 'OTHER', margin?.toFixed(2)]
          );

          const [marketRow] = query<{ id: number }>(
            `SELECT id FROM markets WHERE external_id = ? AND event_id = ?`,
            [market.id, eventDbId]
          );
          const marketDbId = marketRow.id;
          totalMarkets++;

          // Сохраняем исходы
          for (const outcome of market.outcomes) {
            run(
              `INSERT INTO outcomes (external_id, market_id, name, odds, probability)
               VALUES (?, ?, ?, ?, ?)
               ON CONFLICT (external_id, market_id) DO UPDATE SET
                 name = excluded.name,
                 odds = excluded.odds,
                 probability = excluded.probability`,
              [
                outcome.id,
                marketDbId,
                outcome.name,
                outcome.odds,
                (1 / outcome.odds).toFixed(4),
              ]
            );
          }
        }
      }
    }

    // Сохраняем статистику маржи
    for (const [marketType, margins] of marginStats) {
      const stats = calculateMarginStatistics(margins);

      const sportId = sports[0]
        ? query<{ id: number }>('SELECT id FROM sports WHERE external_id = ?', [sports[0].id])[0]?.id
        : null;

      run(
        `INSERT INTO margin_history (sport_id, sport_name, market_type, avg_margin, min_margin, max_margin, sample_size, collected_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [
          sportId,
          'All Sports',
          marketType,
          stats.avgMargin,
          stats.minMargin,
          stats.maxMargin,
          stats.count,
        ]
      );
    }

    // Обновляем сессию
    run(
      `UPDATE scrape_sessions SET
         status = 'completed',
         completed_at = datetime('now'),
         sports_count = ?,
         events_count = ?,
         markets_count = ?
       WHERE id = ?`,
      [sports.length, totalEvents, totalMarkets, sessionId]
    );

    return { sessionId, sportsCount: sports.length, totalEvents, totalMarkets };
  });
}

async function runScraper() {
  console.log('🚀 Starting Winline scraper...\n');
  const startTime = Date.now();

  try {
    await parser.init();
    const { sports, marginStats } = await parser.scrapeAll();

    console.log('\n💾 Saving to database...');
    const result = saveToDatabase(sports, marginStats);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ Scraping completed in ${duration}s`);
    console.log(`   Sports: ${result.sportsCount}`);
    console.log(`   Events: ${result.totalEvents}`);
    console.log(`   Markets: ${result.totalMarkets}`);

    // Выводим статистику маржи
    console.log('\n📊 Margin statistics:');
    for (const [type, margins] of marginStats) {
      const stats = calculateMarginStatistics(margins);
      console.log(`   ${type}: avg ${stats.avgMargin}%, min ${stats.minMargin}%, max ${stats.maxMargin}% (${stats.count} samples)`);
    }
  } catch (error) {
    console.error('❌ Scraping failed:', error);

    // Помечаем сессию как failed
    try {
      run(
        `UPDATE scrape_sessions SET status = 'failed', error_message = ?, completed_at = datetime('now')
         WHERE status = 'running'`,
        [(error as Error).message]
      );
    } catch {}

    process.exit(1);
  } finally {
    await parser.close();
  }
}

runScraper();
