// Общие типы для всего приложения

export interface Sport {
  id: number;
  externalId: string;
  name: string;
  slug: string;
  eventsCount: number;
  marketsCount: number;
  iconUrl?: string;
  isActive: boolean;
  lastUpdated: Date;
}

export interface Tournament {
  id: number;
  externalId: string;
  sportId: number;
  name: string;
  country?: string;
  eventsCount: number;
  lastUpdated: Date;
}

export interface Event {
  id: number;
  externalId: string;
  sportId: number;
  tournamentId: number;
  name: string;
  homeTeam: string;
  awayTeam: string;
  startTime: Date;
  isLive: boolean;
  marketsCount: number;
  lastUpdated: Date;
}

export interface Market {
  id: number;
  externalId: string;
  eventId: number;
  name: string;
  type: MarketType;
  outcomes: Outcome[];
  margin: number;
  lastUpdated: Date;
}

export interface Outcome {
  id: number;
  externalId: string;
  marketId: number;
  name: string;
  odds: number;
  probability: number; // Рассчитанная вероятность без маржи
}

export type MarketType =
  | '1X2'           // Победа 1, ничья, победа 2
  | 'TOTAL'         // Тотал больше/меньше
  | 'HANDICAP'      // Фора
  | 'BOTH_SCORE'    // Обе забьют
  | 'DOUBLE_CHANCE' // Двойной шанс
  | 'CORRECT_SCORE' // Точный счёт
  | 'FIRST_GOAL'    // Кто забьёт первым
  | 'OTHER';        // Прочие рынки

export interface MarginStats {
  id: number;
  sportId: number;
  sportName: string;
  marketType: MarketType;
  avgMargin: number;
  minMargin: number;
  maxMargin: number;
  sampleSize: number;
  collectedAt: Date;
}

export interface ScrapeSession {
  id: number;
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'completed' | 'failed';
  sportsCount: number;
  eventsCount: number;
  marketsCount: number;
  errorMessage?: string;
}

// API Response types
export interface DashboardData {
  lastUpdate: Date;
  totalSports: number;
  totalEvents: number;
  totalMarkets: number;
  sports: SportSummary[];
  marginByType: MarginByType[];
  recentSessions: ScrapeSession[];
}

export interface SportSummary {
  id: number;
  name: string;
  eventsCount: number;
  marketsCount: number;
  avgMargin: number;
}

export interface MarginByType {
  marketType: MarketType;
  avgMargin: number;
  sampleSize: number;
}

export interface SportDetail {
  sport: Sport;
  tournaments: TournamentWithEvents[];
  marginStats: MarginStats[];
}

export interface TournamentWithEvents {
  tournament: Tournament;
  events: EventWithMarkets[];
}

export interface EventWithMarkets {
  event: Event;
  markets: Market[];
}
