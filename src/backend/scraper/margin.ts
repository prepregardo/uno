import type { MarketType } from '../../shared/types.js';

/**
 * Расчёт маржи букмекера
 *
 * Маржа = (сумма вероятностей всех исходов - 1) * 100%
 *
 * Вероятность исхода = 1 / коэффициент
 *
 * Пример для рынка 1X2:
 * - Победа хозяев: 2.10 → вероятность = 1/2.10 = 0.476
 * - Ничья: 3.40 → вероятность = 1/3.40 = 0.294
 * - Победа гостей: 3.20 → вероятность = 1/3.20 = 0.312
 * - Сумма = 0.476 + 0.294 + 0.312 = 1.082
 * - Маржа = (1.082 - 1) * 100% = 8.2%
 */
export function calculateMargin(odds: number[]): number {
  if (odds.length === 0) {
    return 0;
  }

  // Фильтруем невалидные коэффициенты
  const validOdds = odds.filter((odd) => odd > 1);

  if (validOdds.length === 0) {
    return 0;
  }

  // Сумма вероятностей
  const totalProbability = validOdds.reduce((sum, odd) => sum + 1 / odd, 0);

  // Маржа в процентах
  const margin = (totalProbability - 1) * 100;

  // Округляем до 2 знаков
  return Math.round(margin * 100) / 100;
}

/**
 * Расчёт реальной вероятности исхода без маржи
 */
export function calculateFairProbability(odd: number, allOdds: number[]): number {
  const totalProbability = allOdds.reduce((sum, o) => sum + 1 / o, 0);
  const rawProbability = 1 / odd;

  // Убираем маржу из вероятности
  return rawProbability / totalProbability;
}

/**
 * Расчёт справедливого коэффициента без маржи
 */
export function calculateFairOdd(odd: number, allOdds: number[]): number {
  const fairProbability = calculateFairProbability(odd, allOdds);
  return 1 / fairProbability;
}

/**
 * Определение типа рынка по названию
 */
export function detectMarketType(marketName: string): MarketType {
  const name = marketName.toLowerCase();

  if (
    name.includes('1x2') ||
    name.includes('исход') ||
    name.includes('победа') ||
    name.includes('результат матча')
  ) {
    return '1X2';
  }

  if (
    name.includes('тотал') ||
    name.includes('total') ||
    name.includes('больше') ||
    name.includes('меньше')
  ) {
    return 'TOTAL';
  }

  if (
    name.includes('фора') ||
    name.includes('handicap') ||
    name.includes('гандикап')
  ) {
    return 'HANDICAP';
  }

  if (
    name.includes('обе команды забьют') ||
    name.includes('обе забьют') ||
    name.includes('both teams')
  ) {
    return 'BOTH_SCORE';
  }

  if (
    name.includes('двойной шанс') ||
    name.includes('double chance')
  ) {
    return 'DOUBLE_CHANCE';
  }

  if (
    name.includes('точный счёт') ||
    name.includes('точный счет') ||
    name.includes('correct score')
  ) {
    return 'CORRECT_SCORE';
  }

  if (
    name.includes('первый гол') ||
    name.includes('кто забьёт') ||
    name.includes('кто забьет') ||
    name.includes('first goal')
  ) {
    return 'FIRST_GOAL';
  }

  return 'OTHER';
}

/**
 * Статистика маржи для набора рынков
 */
export interface MarginStatistics {
  avgMargin: number;
  minMargin: number;
  maxMargin: number;
  medianMargin: number;
  count: number;
}

export function calculateMarginStatistics(margins: number[]): MarginStatistics {
  if (margins.length === 0) {
    return {
      avgMargin: 0,
      minMargin: 0,
      maxMargin: 0,
      medianMargin: 0,
      count: 0,
    };
  }

  const sorted = [...margins].sort((a, b) => a - b);
  const sum = margins.reduce((a, b) => a + b, 0);

  return {
    avgMargin: Math.round((sum / margins.length) * 100) / 100,
    minMargin: sorted[0],
    maxMargin: sorted[sorted.length - 1],
    medianMargin: sorted[Math.floor(sorted.length / 2)],
    count: margins.length,
  };
}
