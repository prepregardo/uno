import { Page } from 'playwright';
import { browser } from './browser.js';
import { calculateMargin, detectMarketType } from './margin.js';
import type { Sport, Tournament, Event, Market, Outcome, MarketType } from '../../shared/types.js';

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
  outcomes: RawOutcome[];
}

interface RawOutcome {
  id: string;
  name: string;
  odds: number;
}

export class WinlineParser {
  private page: Page | null = null;

  async init(): Promise<void> {
    await browser.init();
    await browser.login();
    await browser.navigateToSports();
    this.page = browser.getPage();
  }

  /**
   * Получение списка всех видов спорта
   */
  async getSports(): Promise<RawSport[]> {
    if (!this.page) throw new Error('Parser not initialized');

    console.log('📊 Fetching sports list...');

    // Ждём загрузки меню спорта
    await this.page.waitForSelector('[class*="sport"], [class*="sidebar"]', {
      timeout: 10000,
    }).catch(() => null);

    // Пробуем найти элементы спорта разными селекторами
    const sports = await this.page.evaluate(() => {
      const sportsList: RawSport[] = [];

      // Ищем элементы спорта в сайдбаре
      const sportElements = document.querySelectorAll(
        '[class*="sport-item"], [class*="sidebar-sport"], [class*="menu-sport"], a[href*="/bets/"]'
      );

      sportElements.forEach((el) => {
        const nameEl = el.querySelector('[class*="name"], [class*="title"], span');
        const countEl = el.querySelector('[class*="count"], [class*="badge"], small');
        const href = el.getAttribute('href') || '';

        // Извлекаем ID из URL
        const idMatch = href.match(/\/bets\/(\w+)/);

        if (nameEl && idMatch) {
          sportsList.push({
            id: idMatch[1],
            name: nameEl.textContent?.trim() || '',
            count: parseInt(countEl?.textContent || '0', 10) || 0,
          });
        }
      });

      return sportsList;
    });

    console.log(`✅ Found ${sports.length} sports`);
    return sports;
  }

  /**
   * Получение событий для конкретного вида спорта
   */
  async getEvents(sportId: string, maxEvents = 50): Promise<RawEvent[]> {
    if (!this.page) throw new Error('Parser not initialized');

    console.log(`⚽ Fetching events for sport ${sportId}...`);

    // Переходим на страницу вида спорта
    await this.page.goto(`https://winline.ru/bets/${sportId}`, {
      waitUntil: 'networkidle',
    });

    await this.page.waitForTimeout(2000);

    // Парсим события
    const events = await this.page.evaluate((maxCount: number) => {
      const eventsList: RawEvent[] = [];

      // Ищем карточки событий
      const eventElements = document.querySelectorAll(
        '[class*="event-card"], [class*="match-card"], [class*="event-row"], [data-event-id]'
      );

      eventElements.forEach((el, index) => {
        if (index >= maxCount) return;

        const eventId = el.getAttribute('data-event-id') ||
                        el.getAttribute('data-id') ||
                        `event_${index}`;

        // Извлекаем названия команд
        const teams = el.querySelectorAll('[class*="team"], [class*="participant"]');
        const homeTeam = teams[0]?.textContent?.trim() || '';
        const awayTeam = teams[1]?.textContent?.trim() || '';

        // Время начала
        const timeEl = el.querySelector('[class*="time"], [class*="date"]');
        const startTime = timeEl?.getAttribute('datetime') ||
                          timeEl?.textContent?.trim() || '';

        // Проверка на live
        const isLive = !!el.querySelector('[class*="live"], [class*="inplay"]');

        // Турнир
        const tournamentEl = el.closest('[class*="tournament"]') ||
                             el.querySelector('[class*="tournament"], [class*="league"]');
        const tournamentName = tournamentEl?.querySelector('[class*="name"]')?.textContent?.trim() || '';
        const tournamentId = tournamentEl?.getAttribute('data-tournament-id') || '';

        eventsList.push({
          id: eventId,
          name: homeTeam && awayTeam ? `${homeTeam} - ${awayTeam}` : el.textContent?.trim()?.substring(0, 100) || '',
          homeTeam,
          awayTeam,
          startTime,
          isLive,
          tournamentId,
          tournamentName,
        });
      });

      return eventsList;
    }, maxEvents);

    console.log(`✅ Found ${events.length} events for sport ${sportId}`);
    return events;
  }

  /**
   * Получение рынков и коэффициентов для события
   */
  async getMarkets(eventId: string): Promise<RawMarket[]> {
    if (!this.page) throw new Error('Parser not initialized');

    // Кликаем на событие чтобы раскрыть рынки или переходим на страницу события
    const eventSelector = `[data-event-id="${eventId}"], [data-id="${eventId}"]`;
    const eventEl = await this.page.$(eventSelector);

    if (eventEl) {
      await eventEl.click();
      await this.page.waitForTimeout(1000);
    }

    // Парсим рынки
    const markets = await this.page.evaluate(() => {
      const marketsList: RawMarket[] = [];

      // Ищем блоки рынков
      const marketElements = document.querySelectorAll(
        '[class*="market"], [class*="bet-group"], [class*="outcome-group"]'
      );

      marketElements.forEach((marketEl) => {
        const marketId = marketEl.getAttribute('data-market-id') ||
                         marketEl.getAttribute('data-id') ||
                         `market_${marketsList.length}`;

        const nameEl = marketEl.querySelector('[class*="market-name"], [class*="title"], [class*="header"]');
        const marketName = nameEl?.textContent?.trim() || '';

        // Извлекаем исходы с коэффициентами
        const outcomeElements = marketEl.querySelectorAll(
          '[class*="outcome"], [class*="odd"], [class*="coefficient"], button[class*="bet"]'
        );

        const outcomes: Array<{ id: string; name: string; odds: number }> = [];

        outcomeElements.forEach((outcomeEl, i) => {
          const outcomeId = outcomeEl.getAttribute('data-outcome-id') ||
                            outcomeEl.getAttribute('data-id') ||
                            `outcome_${i}`;

          // Название исхода
          const outcomeName = outcomeEl.querySelector('[class*="name"], [class*="label"]')?.textContent?.trim() ||
                              outcomeEl.textContent?.trim()?.split(/\s+/)[0] || '';

          // Коэффициент
          const oddsText = outcomeEl.querySelector('[class*="odds"], [class*="coef"], [class*="value"]')?.textContent ||
                           outcomeEl.textContent?.match(/\d+\.\d+/)?.[0] || '0';
          const odds = parseFloat(oddsText.replace(',', '.')) || 0;

          if (odds > 1) {
            outcomes.push({ id: outcomeId, name: outcomeName, odds });
          }
        });

        if (marketName && outcomes.length > 0) {
          marketsList.push({
            id: marketId,
            name: marketName,
            outcomes,
          });
        }
      });

      return marketsList;
    });

    return markets;
  }

  /**
   * Полный сбор данных
   */
  async scrapeAll(): Promise<{
    sports: Array<RawSport & { events: RawEvent[]; markets: Map<string, RawMarket[]> }>;
    marginStats: Map<MarketType, number[]>;
  }> {
    const sports = await this.getSports();
    const marginStats = new Map<MarketType, number[]>();
    const maxEventsPerSport = parseInt(process.env.SCRAPE_MAX_EVENTS_PER_SPORT || '50', 10);

    const enrichedSports = [];

    for (const sport of sports) {
      console.log(`\n📍 Processing sport: ${sport.name}`);

      const events = await this.getEvents(sport.id, maxEventsPerSport);
      const sportMarkets = new Map<string, RawMarket[]>();

      // Для первых N событий собираем рынки для расчёта маржи
      const eventsForMarkets = events.slice(0, 10);

      for (const event of eventsForMarkets) {
        const markets = await this.getMarkets(event.id);
        sportMarkets.set(event.id, markets);

        // Рассчитываем маржу для каждого рынка
        for (const market of markets) {
          const marketType = detectMarketType(market.name);
          const odds = market.outcomes.map((o) => o.odds);
          const margin = calculateMargin(odds);

          if (margin > 0 && margin < 50) {
            // Фильтруем неадекватные значения
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

      // Пауза между видами спорта чтобы не нагружать сервер
      await this.page!.waitForTimeout(1000);
    }

    return { sports: enrichedSports, marginStats };
  }

  async close(): Promise<void> {
    await browser.close();
  }
}

export const parser = new WinlineParser();
