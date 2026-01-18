import { Page } from 'playwright';
import { browser } from './browser.js';
import { calculateMargin, detectMarketType, MarketType } from './margin.js';

interface RawSport {
  id: string;
  name: string;
  count: number;
}

interface RawEvent {
  id: string;
  name: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  isLive: boolean;
  tournamentId: string;
  tournamentName: string;
}

interface RawMarket {
  id: string;
  name: string;
  outcomes: Array<{ id: string; name: string; odds: number }>;
}

export class WinlineParser {
  private page: Page | null = null;

  async init(): Promise<void> {
    await browser.init();
    await browser.login();
    await browser.navigateToSports();
    this.page = browser.getPage();
  }

  async getSports(): Promise<RawSport[]> {
    if (!this.page) throw new Error('Parser not initialized');

    console.log('📊 Fetching sports list...');

    await this.page.waitForSelector('[class*="sport"], [class*="sidebar"], [class*="menu"]', {
      timeout: 15000,
    }).catch(() => null);

    const sports = await this.page.evaluate(() => {
      const sportsList: Array<{ id: string; name: string; count: number }> = [];

      // Ищем ссылки на виды спорта
      const sportLinks = document.querySelectorAll('a[href*="/bets/"]');

      sportLinks.forEach((el) => {
        const href = el.getAttribute('href') || '';
        const idMatch = href.match(/\/bets\/([a-zA-Z0-9-]+)/);

        if (idMatch && idMatch[1] && !idMatch[1].includes('/')) {
          const name = el.textContent?.trim() || '';
          const countMatch = name.match(/\((\d+)\)/);
          const count = countMatch ? parseInt(countMatch[1], 10) : 0;
          const cleanName = name.replace(/\(\d+\)/, '').trim();

          if (cleanName && cleanName.length > 1 && cleanName.length < 50) {
            // Избегаем дубликатов
            if (!sportsList.find(s => s.id === idMatch[1])) {
              sportsList.push({
                id: idMatch[1],
                name: cleanName,
                count,
              });
            }
          }
        }
      });

      return sportsList;
    });

    console.log(`✅ Found ${sports.length} sports`);
    return sports;
  }

  async getEvents(sportId: string, maxEvents = 30): Promise<RawEvent[]> {
    if (!this.page) throw new Error('Parser not initialized');

    console.log(`⚽ Fetching events for ${sportId}...`);

    await this.page.goto(`https://winline.ru/bets/${sportId}`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    await this.page.waitForTimeout(2000);

    const events = await this.page.evaluate((maxCount: number) => {
      const eventsList: Array<{
        id: string;
        name: string;
        homeTeam: string;
        awayTeam: string;
        startTime: string;
        isLive: boolean;
        tournamentId: string;
        tournamentName: string;
      }> = [];

      // Ищем карточки событий по разным селекторам
      const eventElements = document.querySelectorAll(
        '[class*="event"], [class*="match"], [class*="game-card"], [data-event-id]'
      );

      eventElements.forEach((el, index) => {
        if (eventsList.length >= maxCount) return;

        const eventId = el.getAttribute('data-event-id') ||
                        el.getAttribute('data-id') ||
                        `event_${index}_${Date.now()}`;

        // Команды
        const teamElements = el.querySelectorAll('[class*="team"], [class*="participant"], [class*="name"]');
        let homeTeam = '';
        let awayTeam = '';

        if (teamElements.length >= 2) {
          homeTeam = teamElements[0]?.textContent?.trim() || '';
          awayTeam = teamElements[1]?.textContent?.trim() || '';
        }

        // Название события
        const name = homeTeam && awayTeam ? `${homeTeam} - ${awayTeam}` : el.textContent?.trim()?.substring(0, 100) || '';

        // Live статус
        const isLive = !!el.querySelector('[class*="live"], [class*="inplay"]');

        // Время
        const timeEl = el.querySelector('[class*="time"], [class*="date"]');
        const startTime = timeEl?.textContent?.trim() || '';

        // Турнир
        const tournamentEl = el.closest('[class*="tournament"], [class*="league"]');
        const tournamentName = tournamentEl?.querySelector('[class*="name"], [class*="title"]')?.textContent?.trim() || '';

        if (name && name.length > 3) {
          eventsList.push({
            id: eventId,
            name,
            homeTeam,
            awayTeam,
            startTime,
            isLive,
            tournamentId: `tournament_${index}`,
            tournamentName,
          });
        }
      });

      return eventsList;
    }, maxEvents);

    console.log(`✅ Found ${events.length} events for ${sportId}`);
    return events;
  }

  async getMarkets(eventId: string): Promise<RawMarket[]> {
    if (!this.page) throw new Error('Parser not initialized');

    // Кликаем на событие
    const eventSelector = `[data-event-id="${eventId}"], [data-id="${eventId}"]`;
    const eventEl = await this.page.$(eventSelector);

    if (eventEl) {
      await eventEl.click();
      await this.page.waitForTimeout(1500);
    }

    const markets = await this.page.evaluate(() => {
      const marketsList: Array<{
        id: string;
        name: string;
        outcomes: Array<{ id: string; name: string; odds: number }>;
      }> = [];

      const marketElements = document.querySelectorAll(
        '[class*="market"], [class*="bet-group"], [class*="outcome-group"]'
      );

      marketElements.forEach((marketEl, marketIndex) => {
        const marketId = marketEl.getAttribute('data-market-id') || `market_${marketIndex}`;
        const nameEl = marketEl.querySelector('[class*="market-name"], [class*="title"], [class*="header"]');
        const marketName = nameEl?.textContent?.trim() || `Market ${marketIndex + 1}`;

        const outcomeElements = marketEl.querySelectorAll(
          '[class*="outcome"], [class*="odd"], [class*="coefficient"], button[class*="bet"]'
        );

        const outcomes: Array<{ id: string; name: string; odds: number }> = [];

        outcomeElements.forEach((outcomeEl, i) => {
          const outcomeId = outcomeEl.getAttribute('data-outcome-id') || `outcome_${i}`;
          const outcomeName = outcomeEl.querySelector('[class*="name"]')?.textContent?.trim() || `Outcome ${i + 1}`;

          // Ищем коэффициент
          const oddsText = outcomeEl.querySelector('[class*="odds"], [class*="coef"], [class*="value"]')?.textContent ||
                           outcomeEl.textContent?.match(/\d+[.,]\d+/)?.[0] || '0';
          const odds = parseFloat(oddsText.replace(',', '.')) || 0;

          if (odds > 1) {
            outcomes.push({ id: outcomeId, name: outcomeName, odds });
          }
        });

        if (outcomes.length >= 2) {
          marketsList.push({ id: marketId, name: marketName, outcomes });
        }
      });

      return marketsList;
    });

    return markets;
  }

  async scrapeAll(): Promise<{
    sports: Array<RawSport & { events: RawEvent[]; markets: Map<string, RawMarket[]> }>;
    marginStats: Map<MarketType, number[]>;
  }> {
    const sports = await this.getSports();
    const marginStats = new Map<MarketType, number[]>();
    const maxEventsPerSport = parseInt(process.env.SCRAPE_MAX_EVENTS_PER_SPORT || '30', 10);

    const enrichedSports = [];

    for (const sport of sports.slice(0, 10)) { // Ограничим первыми 10 видами спорта
      console.log(`\n📍 Processing sport: ${sport.name}`);

      const events = await this.getEvents(sport.id, maxEventsPerSport);
      const sportMarkets = new Map<string, RawMarket[]>();

      // Собираем рынки для первых событий
      for (const event of events.slice(0, 5)) {
        const markets = await this.getMarkets(event.id);
        sportMarkets.set(event.id, markets);

        for (const market of markets) {
          const marketType = detectMarketType(market.name);
          const odds = market.outcomes.map((o) => o.odds);
          const margin = calculateMargin(odds);

          if (margin > 0 && margin < 50) {
            const existing = marginStats.get(marketType) || [];
            existing.push(margin);
            marginStats.set(marketType, existing);
          }
        }
      }

      enrichedSports.push({
        ...sport,
        events,
        markets: sportMarkets,
      });

      await this.page!.waitForTimeout(1000);
    }

    return { sports: enrichedSports, marginStats };
  }

  async close(): Promise<void> {
    await browser.close();
  }
}

export const parser = new WinlineParser();
