import 'dotenv/config';
import { sql } from '@vercel/postgres';

// Реалистичные данные Winline
const WINLINE_SPORTS = [
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

const FOOTBALL_TOURNAMENTS = [
  { id: 'rpl', name: 'Россия. Премьер-Лига' },
  { id: 'epl', name: 'Англия. Премьер-Лига' },
  { id: 'laliga', name: 'Испания. Ла Лига' },
  { id: 'bundesliga', name: 'Германия. Бундеслига' },
  { id: 'seriea', name: 'Италия. Серия А' },
  { id: 'ligue1', name: 'Франция. Лига 1' },
  { id: 'ucl', name: 'Лига Чемпионов' },
];

const FOOTBALL_TEAMS = {
  rpl: ['Зенит', 'Спартак Москва', 'ЦСКА', 'Локомотив', 'Динамо Москва', 'Краснодар', 'Ростов', 'Рубин'],
  epl: ['Манчестер Сити', 'Арсенал', 'Ливерпуль', 'Манчестер Юнайтед', 'Ньюкасл', 'Челси', 'Тоттенхэм', 'Астон Вилла'],
  laliga: ['Реал Мадрид', 'Барселона', 'Атлетико Мадрид', 'Жирона', 'Атлетик Бильбао', 'Бетис', 'Севилья', 'Вильярреал'],
};

const HOCKEY_TEAMS = ['СКА', 'ЦСКА', 'Ак Барс', 'Металлург Мг', 'Динамо Москва', 'Спартак', 'Локомотив', 'Авангард'];
const BASKETBALL_TEAMS = ['ЦСКА', 'Зенит', 'УНИКС', 'Локомотив-Кубань', 'Химки', 'Нижний Новгород'];

// Реалистичные коэффициенты и маржи для разных типов рынков
const MARKET_TEMPLATES = {
  '1X2': {
    names: ['Исход матча', 'Результат матча (1X2)', 'Победитель'],
    // Маржа обычно 4-7%
    generateOdds: () => {
      const margin = 0.04 + Math.random() * 0.03; // 4-7%
      const p1 = 0.3 + Math.random() * 0.4; // 30-70%
      const pDraw = 0.2 + Math.random() * 0.15; // 20-35%
      const p2 = 1 - p1 - pDraw;
      const factor = 1 + margin;
      return [
        { name: '1', odds: round(factor / p1) },
        { name: 'X', odds: round(factor / pDraw) },
        { name: '2', odds: round(factor / p2) },
      ];
    },
  },
  TOTAL: {
    names: ['Тотал 2.5', 'Тотал голов', 'Больше/Меньше 2.5'],
    // Маржа 4-6%
    generateOdds: () => {
      const margin = 0.04 + Math.random() * 0.02;
      const pOver = 0.45 + Math.random() * 0.1;
      const pUnder = 1 - pOver;
      const factor = 1 + margin;
      return [
        { name: 'Больше 2.5', odds: round(factor / pOver) },
        { name: 'Меньше 2.5', odds: round(factor / pUnder) },
      ];
    },
  },
  HANDICAP: {
    names: ['Фора 1 (-1)', 'Фора 2 (+1)', 'Азиатская фора'],
    // Маржа 3-5%
    generateOdds: () => {
      const margin = 0.03 + Math.random() * 0.02;
      const p1 = 0.4 + Math.random() * 0.2;
      const p2 = 1 - p1;
      const factor = 1 + margin;
      return [
        { name: 'Фора 1 (-1)', odds: round(factor / p1) },
        { name: 'Фора 2 (+1)', odds: round(factor / p2) },
      ];
    },
  },
  BOTH_SCORE: {
    names: ['Обе команды забьют', 'Обе забьют'],
    // Маржа 5-8%
    generateOdds: () => {
      const margin = 0.05 + Math.random() * 0.03;
      const pYes = 0.5 + Math.random() * 0.15;
      const pNo = 1 - pYes;
      const factor = 1 + margin;
      return [
        { name: 'Да', odds: round(factor / pYes) },
        { name: 'Нет', odds: round(factor / pNo) },
      ];
    },
  },
  DOUBLE_CHANCE: {
    names: ['Двойной шанс'],
    // Маржа 6-10%
    generateOdds: () => {
      const margin = 0.06 + Math.random() * 0.04;
      const factor = 1 + margin;
      return [
        { name: '1X', odds: round(factor / 0.6) },
        { name: '12', odds: round(factor / 0.7) },
        { name: 'X2', odds: round(factor / 0.55) },
      ];
    },
  },
};

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function calculateMargin(odds: number[]): number {
  const total = odds.reduce((sum, odd) => sum + 1 / odd, 0);
  return round((total - 1) * 100);
}

function getRandomDate(daysAhead: number): string {
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * daysAhead));
  date.setHours(10 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60), 0, 0);
  return date.toISOString();
}

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

async function seedDatabase() {
  console.log('🌱 Seeding Winline demo data...\n');

  // Создаём сессию
  const sessionResult = await sql`
    INSERT INTO scrape_sessions (status) VALUES ('running') RETURNING id
  `;
  const sessionId = sessionResult.rows[0].id;

  let totalEvents = 0;
  let totalMarkets = 0;
  const marginsByType = new Map<string, number[]>();

  try {
    // Добавляем виды спорта
    for (const sport of WINLINE_SPORTS) {
      console.log(`📍 Adding sport: ${sport.name}...`);

      await sql`
        INSERT INTO sports (external_id, name, slug, events_count, is_active, last_updated)
        VALUES (${sport.id}, ${sport.name}, ${sport.id}, ${sport.eventsCount}, true, NOW())
        ON CONFLICT (external_id) DO UPDATE SET
          name = EXCLUDED.name,
          events_count = EXCLUDED.events_count,
          last_updated = NOW()
      `;

      const sportResult = await sql`SELECT id FROM sports WHERE external_id = ${sport.id}`;
      const sportDbId = sportResult.rows[0].id;

      // Генерируем события для футбола, хоккея, баскетбола
      if (sport.id === 'football') {
        for (const tournament of FOOTBALL_TOURNAMENTS) {
          await sql`
            INSERT INTO tournaments (external_id, sport_id, name, events_count, last_updated)
            VALUES (${tournament.id}, ${sportDbId}, ${tournament.name}, 10, NOW())
            ON CONFLICT (external_id) DO UPDATE SET
              name = EXCLUDED.name,
              last_updated = NOW()
          `;

          const tournamentResult = await sql`SELECT id FROM tournaments WHERE external_id = ${tournament.id}`;
          const tournamentDbId = tournamentResult.rows[0].id;

          // Берём команды для турнира
          const teams = FOOTBALL_TEAMS[tournament.id as keyof typeof FOOTBALL_TEAMS] || FOOTBALL_TEAMS.rpl;
          const shuffled = shuffleArray(teams);

          // Создаём 3-4 матча для турнира
          for (let i = 0; i < Math.min(4, shuffled.length / 2); i++) {
            const homeTeam = shuffled[i * 2];
            const awayTeam = shuffled[i * 2 + 1];
            if (!homeTeam || !awayTeam) continue;

            const eventId = `${tournament.id}_${i}_${Date.now()}`;
            const eventName = `${homeTeam} - ${awayTeam}`;
            const startTime = getRandomDate(7);
            const isLive = Math.random() > 0.8;

            await sql`
              INSERT INTO events (external_id, sport_id, tournament_id, name, home_team, away_team, start_time, is_live, last_updated)
              VALUES (${eventId}, ${sportDbId}, ${tournamentDbId}, ${eventName}, ${homeTeam}, ${awayTeam}, ${startTime}, ${isLive}, NOW())
              ON CONFLICT (external_id) DO UPDATE SET
                name = EXCLUDED.name,
                is_live = EXCLUDED.is_live,
                last_updated = NOW()
            `;

            const eventResult = await sql`SELECT id FROM events WHERE external_id = ${eventId}`;
            const eventDbId = eventResult.rows[0].id;
            totalEvents++;

            // Добавляем рынки
            for (const [marketType, template] of Object.entries(MARKET_TEMPLATES)) {
              const marketId = `${eventId}_${marketType}`;
              const marketName = template.names[Math.floor(Math.random() * template.names.length)];
              const outcomes = template.generateOdds();
              const odds = outcomes.map(o => o.odds);
              const margin = calculateMargin(odds);

              // Сохраняем маржу для статистики
              const existing = marginsByType.get(marketType) || [];
              existing.push(margin);
              marginsByType.set(marketType, existing);

              await sql`
                INSERT INTO markets (external_id, event_id, name, type, margin, last_updated)
                VALUES (${marketId}, ${eventDbId}, ${marketName}, ${marketType}, ${margin}, NOW())
                ON CONFLICT (external_id, event_id) DO UPDATE SET
                  margin = EXCLUDED.margin,
                  last_updated = NOW()
              `;

              const marketResult = await sql`SELECT id FROM markets WHERE external_id = ${marketId} AND event_id = ${eventDbId}`;
              const marketDbId = marketResult.rows[0].id;
              totalMarkets++;

              // Добавляем исходы
              for (const outcome of outcomes) {
                const outcomeId = `${marketId}_${outcome.name}`;
                await sql`
                  INSERT INTO outcomes (external_id, market_id, name, odds, probability)
                  VALUES (${outcomeId}, ${marketDbId}, ${outcome.name}, ${outcome.odds}, ${round(1 / outcome.odds)})
                  ON CONFLICT (external_id, market_id) DO UPDATE SET
                    odds = EXCLUDED.odds,
                    probability = EXCLUDED.probability
                `;
              }
            }
          }
        }
      }

      // Добавляем события для хоккея
      if (sport.id === 'hockey') {
        await sql`
          INSERT INTO tournaments (external_id, sport_id, name, events_count, last_updated)
          VALUES ('khl', ${sportDbId}, 'КХЛ', 20, NOW())
          ON CONFLICT (external_id) DO UPDATE SET last_updated = NOW()
        `;
        const tournamentResult = await sql`SELECT id FROM tournaments WHERE external_id = 'khl'`;
        const tournamentDbId = tournamentResult.rows[0].id;

        const shuffled = shuffleArray(HOCKEY_TEAMS);
        for (let i = 0; i < 4; i++) {
          const homeTeam = shuffled[i * 2];
          const awayTeam = shuffled[i * 2 + 1];
          if (!homeTeam || !awayTeam) continue;

          const eventId = `khl_${i}_${Date.now()}`;
          const eventName = `${homeTeam} - ${awayTeam}`;

          await sql`
            INSERT INTO events (external_id, sport_id, tournament_id, name, home_team, away_team, start_time, is_live, last_updated)
            VALUES (${eventId}, ${sportDbId}, ${tournamentDbId}, ${eventName}, ${homeTeam}, ${awayTeam}, ${getRandomDate(5)}, false, NOW())
            ON CONFLICT (external_id) DO UPDATE SET last_updated = NOW()
          `;
          totalEvents++;
        }
      }

      // Добавляем события для баскетбола
      if (sport.id === 'basketball') {
        await sql`
          INSERT INTO tournaments (external_id, sport_id, name, events_count, last_updated)
          VALUES ('vtb', ${sportDbId}, 'Единая Лига ВТБ', 15, NOW())
          ON CONFLICT (external_id) DO UPDATE SET last_updated = NOW()
        `;
        const tournamentResult = await sql`SELECT id FROM tournaments WHERE external_id = 'vtb'`;
        const tournamentDbId = tournamentResult.rows[0].id;

        const shuffled = shuffleArray(BASKETBALL_TEAMS);
        for (let i = 0; i < 3; i++) {
          const homeTeam = shuffled[i * 2];
          const awayTeam = shuffled[i * 2 + 1];
          if (!homeTeam || !awayTeam) continue;

          const eventId = `vtb_${i}_${Date.now()}`;
          const eventName = `${homeTeam} - ${awayTeam}`;

          await sql`
            INSERT INTO events (external_id, sport_id, tournament_id, name, home_team, away_team, start_time, is_live, last_updated)
            VALUES (${eventId}, ${sportDbId}, ${tournamentDbId}, ${eventName}, ${homeTeam}, ${awayTeam}, ${getRandomDate(5)}, false, NOW())
            ON CONFLICT (external_id) DO UPDATE SET last_updated = NOW()
          `;
          totalEvents++;
        }
      }
    }

    // Сохраняем статистику маржи
    console.log('\n📊 Saving margin statistics...');
    for (const [marketType, margins] of marginsByType) {
      if (margins.length === 0) continue;

      const sorted = [...margins].sort((a, b) => a - b);
      const avgMargin = round(margins.reduce((a, b) => a + b, 0) / margins.length);
      const minMargin = sorted[0];
      const maxMargin = sorted[sorted.length - 1];

      await sql`
        INSERT INTO margin_history (sport_id, sport_name, market_type, avg_margin, min_margin, max_margin, sample_size, collected_at)
        VALUES (NULL, 'All Sports', ${marketType}, ${avgMargin}, ${minMargin}, ${maxMargin}, ${margins.length}, NOW())
      `;

      console.log(`   ${marketType}: avg ${avgMargin}%, min ${minMargin}%, max ${maxMargin}%`);
    }

    // Завершаем сессию
    await sql`
      UPDATE scrape_sessions SET
        status = 'completed',
        completed_at = NOW(),
        sports_count = ${WINLINE_SPORTS.length},
        events_count = ${totalEvents},
        markets_count = ${totalMarkets}
      WHERE id = ${sessionId}
    `;

    console.log(`\n✅ Demo data seeded successfully!`);
    console.log(`   Sports: ${WINLINE_SPORTS.length}`);
    console.log(`   Events: ${totalEvents}`);
    console.log(`   Markets: ${totalMarkets}`);
  } catch (error) {
    await sql`
      UPDATE scrape_sessions SET status = 'failed', error_message = ${(error as Error).message}, completed_at = NOW()
      WHERE id = ${sessionId}
    `;
    throw error;
  }
}

seedDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
