import 'dotenv/config';
import { sql } from '@vercel/postgres';
import { parser } from './parser.js';
import { calculateMarginStatistics, MarketType } from './margin.js';

async function saveToDatabase(
  sports: Awaited<ReturnType<typeof parser.scrapeAll>>['sports'],
  marginStats: Map<MarketType, number[]>
) {
  console.log('\n💾 Saving to Vercel Postgres...');

  // Создаём сессию парсинга
  const sessionResult = await sql`
    INSERT INTO scrape_sessions (status) VALUES ('running') RETURNING id
  `;
  const sessionId = sessionResult.rows[0].id;

  let totalEvents = 0;
  let totalMarkets = 0;

  try {
    for (const sport of sports) {
      // Upsert спорта
      await sql`
        INSERT INTO sports (external_id, name, slug, events_count, is_active, last_updated)
        VALUES (${sport.id}, ${sport.name}, ${sport.id}, ${sport.events.length}, true, NOW())
        ON CONFLICT (external_id) DO UPDATE SET
          name = EXCLUDED.name,
          events_count = EXCLUDED.events_count,
          last_updated = NOW()
      `;

      const sportResult = await sql`SELECT id FROM sports WHERE external_id = ${sport.id}`;
      const sportDbId = sportResult.rows[0].id;

      for (const event of sport.events) {
        // Upsert турнира
        let tournamentDbId = null;
        if (event.tournamentId) {
          await sql`
            INSERT INTO tournaments (external_id, sport_id, name, events_count, last_updated)
            VALUES (${event.tournamentId}, ${sportDbId}, ${event.tournamentName || 'Unknown'}, 1, NOW())
            ON CONFLICT (external_id) DO UPDATE SET
              name = EXCLUDED.name,
              last_updated = NOW()
          `;

          const tournamentResult = await sql`SELECT id FROM tournaments WHERE external_id = ${event.tournamentId}`;
          tournamentDbId = tournamentResult.rows[0]?.id || null;
        }

        // Upsert события
        await sql`
          INSERT INTO events (external_id, sport_id, tournament_id, name, home_team, away_team, start_time, is_live, last_updated)
          VALUES (${event.id}, ${sportDbId}, ${tournamentDbId}, ${event.name}, ${event.homeTeam}, ${event.awayTeam}, ${event.startTime || null}, ${event.isLive}, NOW())
          ON CONFLICT (external_id) DO UPDATE SET
            name = EXCLUDED.name,
            home_team = EXCLUDED.home_team,
            away_team = EXCLUDED.away_team,
            is_live = EXCLUDED.is_live,
            last_updated = NOW()
        `;

        const eventResult = await sql`SELECT id FROM events WHERE external_id = ${event.id}`;
        const eventDbId = eventResult.rows[0].id;
        totalEvents++;

        // Сохраняем рынки
        const markets = sport.markets.get(event.id) || [];
        for (const market of markets) {
          const odds = market.outcomes.map((o) => o.odds);
          const margin = odds.length > 0
            ? (odds.reduce((sum, o) => sum + 1 / o, 0) - 1) * 100
            : null;

          await sql`
            INSERT INTO markets (external_id, event_id, name, type, margin, last_updated)
            VALUES (${market.id}, ${eventDbId}, ${market.name}, 'OTHER', ${margin?.toFixed(2)}, NOW())
            ON CONFLICT (external_id, event_id) DO UPDATE SET
              name = EXCLUDED.name,
              margin = EXCLUDED.margin,
              last_updated = NOW()
          `;

          const marketResult = await sql`SELECT id FROM markets WHERE external_id = ${market.id} AND event_id = ${eventDbId}`;
          const marketDbId = marketResult.rows[0].id;
          totalMarkets++;

          // Сохраняем исходы
          for (const outcome of market.outcomes) {
            await sql`
              INSERT INTO outcomes (external_id, market_id, name, odds, probability)
              VALUES (${outcome.id}, ${marketDbId}, ${outcome.name}, ${outcome.odds}, ${(1 / outcome.odds).toFixed(4)})
              ON CONFLICT (external_id, market_id) DO UPDATE SET
                name = EXCLUDED.name,
                odds = EXCLUDED.odds,
                probability = EXCLUDED.probability
            `;
          }
        }
      }

      console.log(`   ✓ ${sport.name}: ${sport.events.length} events`);
    }

    // Сохраняем статистику маржи
    for (const [marketType, margins] of marginStats) {
      const stats = calculateMarginStatistics(margins);

      await sql`
        INSERT INTO margin_history (sport_id, sport_name, market_type, avg_margin, min_margin, max_margin, sample_size, collected_at)
        VALUES (NULL, 'All Sports', ${marketType}, ${stats.avgMargin}, ${stats.minMargin}, ${stats.maxMargin}, ${stats.count}, NOW())
      `;
    }

    // Обновляем сессию
    await sql`
      UPDATE scrape_sessions SET
        status = 'completed',
        completed_at = NOW(),
        sports_count = ${sports.length},
        events_count = ${totalEvents},
        markets_count = ${totalMarkets}
      WHERE id = ${sessionId}
    `;

    return { sessionId, sportsCount: sports.length, totalEvents, totalMarkets };
  } catch (error) {
    await sql`
      UPDATE scrape_sessions SET status = 'failed', error_message = ${(error as Error).message}, completed_at = NOW()
      WHERE id = ${sessionId}
    `;
    throw error;
  }
}

async function run() {
  console.log('🚀 Starting Winline scraper...\n');
  console.log('📡 Database: Vercel Postgres');

  if (!process.env.POSTGRES_URL) {
    console.error('❌ POSTGRES_URL not set. Copy variables from Vercel Dashboard.');
    console.log('\nCreate .env.local with:');
    console.log('  POSTGRES_URL=your_postgres_url');
    process.exit(1);
  }

  const startTime = Date.now();

  try {
    await parser.init();
    const { sports, marginStats } = await parser.scrapeAll();

    const result = await saveToDatabase(sports, marginStats);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ Scraping completed in ${duration}s`);
    console.log(`   Sports: ${result.sportsCount}`);
    console.log(`   Events: ${result.totalEvents}`);
    console.log(`   Markets: ${result.totalMarkets}`);

    console.log('\n📊 Margin statistics:');
    for (const [type, margins] of marginStats) {
      const stats = calculateMarginStatistics(margins);
      console.log(`   ${type}: avg ${stats.avgMargin}%, min ${stats.minMargin}%, max ${stats.maxMargin}% (${stats.count} samples)`);
    }

  } catch (error) {
    console.error('❌ Scraping failed:', error);
    process.exit(1);
  } finally {
    await parser.close();
  }
}

run();
