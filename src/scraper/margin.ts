/**
 * Расчёт маржи букмекера
 *
 * Маржа = (сумма вероятностей всех исходов - 1) * 100%
 * Вероятность исхода = 1 / коэффициент
 */

export type MarketType =
  | '1X2'
  | 'TOTAL'
  | 'HANDICAP'
  | 'BOTH_SCORE'
  | 'DOUBLE_CHANCE'
  | 'CORRECT_SCORE'
  | 'FIRST_GOAL'
  | 'OTHER';

export function calculateMargin(odds: number[]): number {
  if (odds.length === 0) return 0;

  const validOdds = odds.filter((odd) => odd > 1);
  if (validOdds.length === 0) return 0;

  const totalProbability = validOdds.reduce((sum, odd) => sum + 1 / odd, 0);
  const margin = (totalProbability - 1) * 100;

  return Math.round(margin * 100) / 100;
}

export function detectMarketType(marketName: string): MarketType {
  const name = marketName.toLowerCase();

  if (name.includes('1x2') || name.includes('исход') || name.includes('победа') || name.includes('результат матча')) {
    return '1X2';
  }
  if (name.includes('тотал') || name.includes('total') || name.includes('больше') || name.includes('меньше')) {
    return 'TOTAL';
  }
  if (name.includes('фора') || name.includes('handicap') || name.includes('гандикап')) {
    return 'HANDICAP';
  }
  if (name.includes('обе команды забьют') || name.includes('обе забьют')) {
    return 'BOTH_SCORE';
  }
  if (name.includes('двойной шанс')) {
    return 'DOUBLE_CHANCE';
  }
  if (name.includes('точный счёт') || name.includes('точный счет')) {
    return 'CORRECT_SCORE';
  }
  if (name.includes('первый гол') || name.includes('кто забьёт')) {
    return 'FIRST_GOAL';
  }

  return 'OTHER';
}

export interface MarginStatistics {
  avgMargin: number;
  minMargin: number;
  maxMargin: number;
  count: number;
}

export function calculateMarginStatistics(margins: number[]): MarginStatistics {
  if (margins.length === 0) {
    return { avgMargin: 0, minMargin: 0, maxMargin: 0, count: 0 };
  }

  const sorted = [...margins].sort((a, b) => a - b);
  const sum = margins.reduce((a, b) => a + b, 0);

  return {
    avgMargin: Math.round((sum / margins.length) * 100) / 100,
    minMargin: sorted[0],
    maxMargin: sorted[sorted.length - 1],
    count: margins.length,
  };
}
