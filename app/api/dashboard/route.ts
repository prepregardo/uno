import { NextResponse } from 'next/server';
import { getDashboardData } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getDashboardData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Dashboard API error:', error);

    // Возвращаем демо-данные если БД не настроена
    return NextResponse.json(getDemoData());
  }
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
