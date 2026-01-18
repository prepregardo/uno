import { parser } from './parser.js';
import { query, transaction } from '../db/connection.js';
import { calculateMarginStatistics } from './margin.js';
import type { MarketType } from '../../shared/types.js';

async function saveToDatabase(
  sports: Awaited<ReturnType<typeof parser.scrapeAll>>['sports'],
  marginStats: Map<MarketType, number[]>
) {
  return transaction(async (client) => {
    // Создаём сессию парсинга
    const [session] = await client.query(
      'INSERT INTO scrape_sessions (status) VALUES ($1) RETURNING id',
      ['running']
    ).then((r) => r.rows);

    const sessionId = session.id;
    let totalEvents = 0;
    let totalMarkets = 0;

    for (const sport of sports) {
      // Upsert спорта
      const [sportRow] = await client.query(
        `INSERT INTO sports (external_id, name, slug, events_count, is_active, last_updated)
         VALUES ($1, $2, $3, $4, true, NOW())
         ON CONFLICT (external_id) DO UPDATE SET
           name = EXCLUDED.name,
           events_count = EXCLUDED.events_count,
           last_updated = NOW()
         RETURNING id`,
        [sport.id, sport.name, sport.id, sport.events.length]
      ).then((r) => r.rows);

      const sportDbId = sportRow.id;

      // Сохраняем события
      for (const event of sport.events) {
        // Upsert турнира
        let tournamentDbId = null;
        if (event.tournamentId) {
          const [tournamentRow] = await client.query(
            `INSERT INTO tournaments (external_id, sport_id, name, events_count, last_updated)
             VALUES ($1, $2, $3, 1, NOW())
             ON CONFLICT (external_id) DO UPDATE SET
               name = EXCLUDED.name,
               last_updated = NOW()
             RETURNING id`,
            [event.tournamentId, sportDbId, event.tournamentName || 'Unknown']
          ).then((r) => r.rows);
          tournamentDbId = tournamentRow.id;
        }

        // Upsert события
        const [eventRow] = await client.query(
          `INSERT INTO events (external_id, sport_id, tournament_id, name, home_team, away_team, start_time, is_live, last_updated)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
           ON CONFLICT (external_id) DO UPDATE SET
             name = EXCLUDED.name,
             home_team = EXCLUDED.home_team,
             away_team = EXCLUDED.away_team,
             is_live = EXCLUDED.is_live,
             last_updated = NOW()
           RETURNING id`,
          [
            event.id,
            sportDbId,
            tournamentDbId,
            event.name,
            event.homeTeam,
            event.awayTeam,
            event.startTime || null,
            event.isLive,
          ]
        ).then((r) => r.rows);

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

          const [marketRow] = await client.query(
            `INSERT INTO markets (external_id, event_id, name, type, margin, last_updated)
             VALUES ($1, $2, $3, $4, $5, NOW())
             ON CONFLICT (external_id, event_id) DO UPDATE SET
               name = EXCLUDED.name,
               margin = EXCLUDED.margin,
               last_updated = NOW()
             RETURNING id`,
            [market.id, eventDbId, market.name, 'OTHER', margin?.toFixed(2)]
          ).then((r) => r.rows);

          const marketDbId = marketRow.id;
          totalMarkets++;

          // Сохраняем исходы
          for (const outcome of market.outcomes) {
            await client.query(
              `INSERT INTO outcomes (external_id, market_id, name, odds, probability)
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT (external_id, market_id) DO UPDATE SET
                 name = EXCLUDED.name,
                 odds = EXCLUDED.odds,
                 probability = EXCLUDED.probability`,
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

      // Находим sport_id для первого спорта (или используем общую статистику)
      const sportId = sports[0] ? (await client.query(
        'SELECT id FROM sports WHERE external_id = $1',
        [sports[0].id]
      ).then((r) => r.rows[0]?.id)) : null;

      await client.query(
        `INSERT INTO margin_history (sport_id, sport_name, market_type, avg_margin, min_margin, max_margin, sample_size, collected_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
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
    await client.query(
      `UPDATE scrape_sessions SET
         status = 'completed',
         completed_at = NOW(),
         sports_count = $1,
         events_count = $2,
         markets_count = $3
       WHERE id = $4`,
      [sports.length, totalEvents, totalMarkets, sessionId]
    );

    return { sessionId, sportsCount: sports.length, totalEvents, totalMarkets };
  });
}

async function run() {
  console.log('🚀 Starting Winline scraper...\n');
  const startTime = Date.now();

  try {
    await parser.init();
    const { sports, marginStats } = await parser.scrapeAll();

    console.log('\n💾 Saving to database...');
    const result = await saveToDatabase(sports, marginStats);

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
    await query(
      `UPDATE scrape_sessions SET status = 'failed', error_message = $1, completed_at = NOW()
       WHERE status = 'running' ORDER BY started_at DESC LIMIT 1`,
      [(error as Error).message]
    );

    process.exit(1);
  } finally {
    await parser.close();
  }
}

run();
