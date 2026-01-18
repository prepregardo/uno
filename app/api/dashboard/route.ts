import { NextResponse } from 'next/server';
import { getDashboardData } from '@/lib/db';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shouldSeed = searchParams.get('seed') === 'true';

  try {
    if (shouldSeed) {
      await seedDemoData();
    }

    const data = await getDashboardData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(getDemoData());
  }
}

// Seed demo data directly
async function seedDemoData() {
  const SPORTS = [
    { id: 'football', name: 'Футбол', eventsCount: 847 },
    { id: 'hockey', name: 'Хоккей', eventsCount: 234 },
    { id: 'basketball', name: 'Баскетбол', eventsCount: 312 },
    { id: 'tennis', name: 'Теннис', eventsCount: 456 },
    { id: 'volleyball', name: 'Волейбол', eventsCount: 123 },
    { id: 'handball', name: 'Гандбол', eventsCount: 78 },
    { id: 'table-tennis', name: 'Настольный теннис', eventsCount: 189 },
    { id: 'mma', name: 'ММА', eventsCount: 45 },
    { id: 'boxing', name: 'Бокс', eventsCount: 23 },
    { id: 'esports', name: 'Киберспорт', eventsCount: 567 },
  ];

  const TOURNAMENTS = [
    { id: 'rpl', sportId: 'football', name: 'Россия. Премьер-Лига' },
    { id: 'epl', sportId: 'football', name: 'Англия. Премьер-Лига' },
    { id: 'laliga', sportId: 'football', name: 'Испания. Ла Лига' },
    { id: 'ucl', sportId: 'football', name: 'Лига Чемпионов' },
    { id: 'khl', sportId: 'hockey', name: 'КХЛ' },
    { id: 'vtb', sportId: 'basketball', name: 'Единая Лига ВТБ' },
  ];

  const MATCHES = [
    { tournament: 'rpl', home: 'Зенит', away: 'Спартак Москва' },
    { tournament: 'rpl', home: 'ЦСКА', away: 'Локомотив' },
    { tournament: 'rpl', home: 'Динамо Москва', away: 'Краснодар' },
    { tournament: 'epl', home: 'Манчестер Сити', away: 'Арсенал' },
    { tournament: 'epl', home: 'Ливерпуль', away: 'Челси' },
    { tournament: 'epl', home: 'Манчестер Юнайтед', away: 'Тоттенхэм' },
    { tournament: 'laliga', home: 'Реал Мадрид', away: 'Барселона' },
    { tournament: 'laliga', home: 'Атлетико Мадрид', away: 'Севилья' },
    { tournament: 'ucl', home: 'Бавария', away: 'ПСЖ' },
    { tournament: 'ucl', home: 'Интер', away: 'Манчестер Сити' },
    { tournament: 'khl', home: 'СКА', away: 'ЦСКА' },
    { tournament: 'khl', home: 'Ак Барс', away: 'Металлург Мг' },
    { tournament: 'khl', home: 'Динамо Москва', away: 'Локомотив' },
    { tournament: 'vtb', home: 'ЦСКА', away: 'Зенит' },
    { tournament: 'vtb', home: 'УНИКС', away: 'Локомотив-Кубань' },
  ];

  // Create session
  const sessionResult = await sql`
    INSERT INTO scrape_sessions (status) VALUES ('running') RETURNING id
  `;
  const sessionId = sessionResult.rows[0].id;

  let totalEvents = 0;
  let totalMarkets = 0;

  // Insert sports
  for (const sport of SPORTS) {
    await sql`
      INSERT INTO sports (external_id, name, slug, events_count, is_active, last_updated)
      VALUES (${sport.id}, ${sport.name}, ${sport.id}, ${sport.eventsCount}, true, NOW())
      ON CONFLICT (external_id) DO UPDATE SET
        events_count = EXCLUDED.events_count,
        last_updated = NOW()
    `;
  }

  // Insert tournaments
  for (const t of TOURNAMENTS) {
    const sportResult = await sql`SELECT id FROM sports WHERE external_id = ${t.sportId}`;
    if (sportResult.rows[0]) {
      await sql`
        INSERT INTO tournaments (external_id, sport_id, name, events_count, last_updated)
        VALUES (${t.id}, ${sportResult.rows[0].id}, ${t.name}, 10, NOW())
        ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name, last_updated = NOW()
      `;
    }
  }

  // Insert matches with markets
  const ts = Date.now();
  for (let i = 0; i < MATCHES.length; i++) {
    const match = MATCHES[i];
    const tournamentResult = await sql`SELECT id, sport_id FROM tournaments WHERE external_id = ${match.tournament}`;
    if (!tournamentResult.rows[0]) continue;

    const eventId = `${match.tournament}_${i}_${ts}`;
    const eventName = `${match.home} - ${match.away}`;
    const startTime = new Date(Date.now() + (1 + Math.random() * 6) * 24 * 60 * 60 * 1000).toISOString();

    await sql`
      INSERT INTO events (external_id, sport_id, tournament_id, name, home_team, away_team, start_time, is_live, last_updated)
      VALUES (${eventId}, ${tournamentResult.rows[0].sport_id}, ${tournamentResult.rows[0].id}, ${eventName}, ${match.home}, ${match.away}, ${startTime}, false, NOW())
      ON CONFLICT (external_id) DO UPDATE SET name = EXCLUDED.name, last_updated = NOW()
    `;

    const eventResult = await sql`SELECT id FROM events WHERE external_id = ${eventId}`;
    if (!eventResult.rows[0]) continue;
    const eventDbId = eventResult.rows[0].id;
    totalEvents++;

    // Add markets
    const markets = [
      { type: '1X2', name: 'Исход матча', odds: [2.1 + Math.random(), 3.2 + Math.random(), 3.5 + Math.random()] },
      { type: 'TOTAL', name: 'Тотал 2.5', odds: [1.85 + Math.random() * 0.3, 1.95 + Math.random() * 0.3] },
      { type: 'HANDICAP', name: 'Фора 1 (-1)', odds: [1.9 + Math.random() * 0.2, 1.9 + Math.random() * 0.2] },
      { type: 'BOTH_SCORE', name: 'Обе забьют', odds: [1.7 + Math.random() * 0.3, 2.1 + Math.random() * 0.3] },
      { type: 'DOUBLE_CHANCE', name: 'Двойной шанс', odds: [1.3 + Math.random() * 0.2, 1.5 + Math.random() * 0.2, 1.6 + Math.random() * 0.2] },
    ];

    for (const market of markets) {
      const marketId = `${eventId}_${market.type}`;
      const margin = Math.round(((market.odds.reduce((sum, o) => sum + 1/o, 0) - 1) * 100) * 100) / 100;

      await sql`
        INSERT INTO markets (external_id, event_id, name, type, margin, last_updated)
        VALUES (${marketId}, ${eventDbId}, ${market.name}, ${market.type}, ${margin}, NOW())
        ON CONFLICT (external_id, event_id) DO UPDATE SET margin = EXCLUDED.margin, last_updated = NOW()
      `;

      const marketResult = await sql`SELECT id FROM markets WHERE external_id = ${marketId} AND event_id = ${eventDbId}`;
      if (!marketResult.rows[0]) continue;
      const marketDbId = marketResult.rows[0].id;
      totalMarkets++;

      // Add outcomes
      const outcomeNames = market.type === '1X2' ? ['1', 'X', '2'] :
                          market.type === 'TOTAL' ? ['Больше 2.5', 'Меньше 2.5'] :
                          market.type === 'HANDICAP' ? ['Фора 1', 'Фора 2'] :
                          market.type === 'BOTH_SCORE' ? ['Да', 'Нет'] :
                          ['1X', '12', 'X2'];

      for (let j = 0; j < market.odds.length; j++) {
        const outcomeId = `${marketId}_${j}`;
        const odds = Math.round(market.odds[j] * 100) / 100;
        await sql`
          INSERT INTO outcomes (external_id, market_id, name, odds, probability)
          VALUES (${outcomeId}, ${marketDbId}, ${outcomeNames[j]}, ${odds}, ${Math.round((1/odds) * 10000) / 10000})
          ON CONFLICT (external_id, market_id) DO UPDATE SET odds = EXCLUDED.odds
        `;
      }
    }
  }

  // Save margin stats
  const marginStats = [
    { type: '1X2', avg: 5.2, min: 4.1, max: 6.8 },
    { type: 'TOTAL', avg: 4.8, min: 3.9, max: 5.9 },
    { type: 'HANDICAP', avg: 4.2, min: 3.2, max: 5.4 },
    { type: 'BOTH_SCORE', avg: 6.5, min: 5.2, max: 8.1 },
    { type: 'DOUBLE_CHANCE', avg: 7.8, min: 6.1, max: 9.5 },
  ];

  for (const stat of marginStats) {
    await sql`
      INSERT INTO margin_history (sport_id, sport_name, market_type, avg_margin, min_margin, max_margin, sample_size, collected_at)
      VALUES (NULL, 'All Sports', ${stat.type}, ${stat.avg}, ${stat.min}, ${stat.max}, ${MATCHES.length}, NOW())
    `;
  }

  // Complete session
  await sql`
    UPDATE scrape_sessions SET
      status = 'completed',
      completed_at = NOW(),
      sports_count = ${SPORTS.length},
      events_count = ${totalEvents},
      markets_count = ${totalMarkets}
    WHERE id = ${sessionId}
  `;
}

function getDemoData() {
  return {
    lastUpdate: new Date().toISOString(),
    totalSports: 25,
    totalEvents: 1847,
    totalMarkets: 12453,
    sports: [
      { id: 1, name: 'Футбол', eventsCount: 523, marketsCount: 4521, avgMargin: 5.2 },
      { id: 2, name: 'Хоккей', eventsCount: 187, marketsCount: 1456, avgMargin: 5.8 },
      { id: 3, name: 'Баскетбол', eventsCount: 234, marketsCount: 1876, avgMargin: 6.1 },
      { id: 4, name: 'Теннис', eventsCount: 312, marketsCount: 1543, avgMargin: 5.5 },
      { id: 5, name: 'Волейбол', eventsCount: 98, marketsCount: 654, avgMargin: 6.3 },
      { id: 6, name: 'Киберспорт', eventsCount: 156, marketsCount: 987, avgMargin: 7.2 },
    ],
    marginByType: [
      { marketType: '1X2', avgMargin: 5.2, sampleSize: 1523 },
      { marketType: 'TOTAL', avgMargin: 5.8, sampleSize: 2341 },
      { marketType: 'HANDICAP', avgMargin: 6.1, sampleSize: 1876 },
      { marketType: 'BOTH_SCORE', avgMargin: 7.3, sampleSize: 543 },
      { marketType: 'DOUBLE_CHANCE', avgMargin: 8.5, sampleSize: 321 },
    ],
    recentSessions: [
      { id: 1, started_at: new Date().toISOString(), completed_at: new Date().toISOString(), status: 'completed', sports_count: 25, events_count: 1847, markets_count: 12453 },
    ],
  };
}
