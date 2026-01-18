'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

// ============ ТИПЫ ============
interface Sport {
  id: number;
  name: string;
  eventsCount: number;
  marketsCount: number;
  avgMargin: number;
}

interface MarginData {
  marketType: string;
  avgMargin: number;
  minMargin?: number;
  maxMargin?: number;
  sampleSize: number;
}

interface Session {
  id: number;
  started_at: string;
  completed_at: string;
  status: 'running' | 'completed' | 'failed';
  sports_count: number;
  events_count: number;
  markets_count: number;
}

interface DashboardData {
  lastUpdate: string;
  totalSports: number;
  totalEvents: number;
  totalMarkets: number;
  sports: Sport[];
  marginByType: MarginData[];
  recentSessions: Session[];
}

// ============ КОНСТАНТЫ ============
const MARKET_LABELS: Record<string, string> = {
  '1X2': 'Исход (1X2)',
  TOTAL: 'Тоталы',
  HANDICAP: 'Форы',
  BOTH_SCORE: 'Обе забьют',
  DOUBLE_CHANCE: 'Двойной шанс',
};

const SPORT_ICONS: Record<string, string> = {
  'Футбол': '⚽',
  'Хоккей': '🏒',
  'Баскетбол': '🏀',
  'Теннис': '🎾',
  'Волейбол': '🏐',
  'Киберспорт': '🎮',
  'Настольный теннис': '🏓',
  'Гандбол': '🤾',
  'ММА': '🥊',
  'Бокс': '🥋',
};

const COLORS = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
  blue: '#2563eb',
};

// ============ ДЕМО ДАННЫЕ ============
const DEMO_DATA: DashboardData = {
  lastUpdate: new Date().toISOString(),
  totalSports: 10,
  totalEvents: 2874,
  totalMarkets: 18453,
  sports: [
    { id: 1, name: 'Футбол', eventsCount: 847, marketsCount: 7521, avgMargin: 5.2 },
    { id: 2, name: 'Хоккей', eventsCount: 234, marketsCount: 1856, avgMargin: 5.8 },
    { id: 3, name: 'Баскетбол', eventsCount: 312, marketsCount: 2476, avgMargin: 6.1 },
    { id: 4, name: 'Теннис', eventsCount: 456, marketsCount: 1843, avgMargin: 5.5 },
    { id: 5, name: 'Волейбол', eventsCount: 123, marketsCount: 854, avgMargin: 6.3 },
    { id: 6, name: 'Киберспорт', eventsCount: 567, marketsCount: 2187, avgMargin: 7.2 },
    { id: 7, name: 'Настольный теннис', eventsCount: 189, marketsCount: 756, avgMargin: 6.8 },
    { id: 8, name: 'Гандбол', eventsCount: 78, marketsCount: 468, avgMargin: 6.5 },
    { id: 9, name: 'ММА', eventsCount: 45, marketsCount: 315, avgMargin: 7.8 },
    { id: 10, name: 'Бокс', eventsCount: 23, marketsCount: 177, avgMargin: 8.2 },
  ],
  marginByType: [
    { marketType: 'HANDICAP', avgMargin: 4.2, minMargin: 3.2, maxMargin: 5.4, sampleSize: 2891 },
    { marketType: 'TOTAL', avgMargin: 4.8, minMargin: 3.9, maxMargin: 5.9, sampleSize: 3562 },
    { marketType: '1X2', avgMargin: 5.2, minMargin: 4.1, maxMargin: 6.8, sampleSize: 2847 },
    { marketType: 'BOTH_SCORE', avgMargin: 6.5, minMargin: 5.2, maxMargin: 8.1, sampleSize: 1243 },
    { marketType: 'DOUBLE_CHANCE', avgMargin: 7.8, minMargin: 6.1, maxMargin: 9.5, sampleSize: 987 },
  ],
  recentSessions: [
    { id: 1, started_at: new Date().toISOString(), completed_at: new Date().toISOString(), status: 'completed', sports_count: 10, events_count: 2874, markets_count: 18453 },
    { id: 2, started_at: new Date(Date.now() - 3600000).toISOString(), completed_at: new Date(Date.now() - 3600000).toISOString(), status: 'completed', sports_count: 10, events_count: 2756, markets_count: 17987 },
    { id: 3, started_at: new Date(Date.now() - 7200000).toISOString(), completed_at: new Date(Date.now() - 7200000).toISOString(), status: 'completed', sports_count: 10, events_count: 2698, markets_count: 17654 },
  ],
};

// ============ УТИЛИТЫ ============
function getMarginLevel(margin: number): 'low' | 'medium' | 'high' {
  if (margin < 5) return 'low';
  if (margin < 7) return 'medium';
  return 'high';
}

function formatDate(dateString: string): string {
  try {
    return format(new Date(dateString), 'dd MMMM yyyy, HH:mm', { locale: ru });
  } catch {
    return dateString;
  }
}

function formatShortDate(dateString: string): string {
  try {
    return format(new Date(dateString), 'dd.MM.yy HH:mm');
  } catch {
    return '-';
  }
}

// ============ ГЛАВНЫЙ КОМПОНЕНТ ============
export default function HomePage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('API error');
      const result = await res.json();

      if (!result.totalSports || result.totalSports === 0) {
        setData(DEMO_DATA);
        setIsDemo(true);
      } else {
        setData(result);
        setIsDemo(false);
      }
    } catch {
      setData(DEMO_DATA);
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="loading-spinner" />
          <p>Загрузка данных...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const avgMargin = data.marginByType.length > 0
    ? data.marginByType.reduce((sum, m) => sum + m.avgMargin, 0) / data.marginByType.length
    : 0;

  return (
    <div className="container">
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <h1>Winline</h1>
          <p className="subtitle">Автоматизированный анализ букмекерской конторы</p>
          <div className="hero-rating">
            ★★★★<span>★</span>
            <span style={{ fontSize: '20px', marginLeft: '8px' }}>4.2 / 5</span>
          </div>
          <a href="https://winline.ru" target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            Перейти на сайт
          </a>
        </div>
      </section>

      {/* Last Update */}
      <div className="last-update">
        {isDemo && <span className="demo-badge">Демо-данные</span>}
        Обновлено: {formatDate(data.lastUpdate)}
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <span className="stat-value">{data.totalSports}</span>
          <span className="stat-label">Видов спорта</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <span className="stat-value">{data.totalEvents.toLocaleString()}</span>
          <span className="stat-label">Событий</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <span className="stat-value">{data.totalMarkets.toLocaleString()}</span>
          <span className="stat-label">Рынков</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <span className="stat-value">{avgMargin.toFixed(1)}%</span>
          <span className="stat-label">Средняя маржа</span>
        </div>
      </div>

      {/* Margin Analysis */}
      <div className="card">
        <h2>Анализ маржи по типам ставок</h2>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Тип рынка</th>
                <th>Средняя</th>
                <th>Мин.</th>
                <th>Макс.</th>
                <th style={{ width: '30%' }}>Визуализация</th>
                <th>Выборка</th>
              </tr>
            </thead>
            <tbody>
              {data.marginByType.map((item) => {
                const level = getMarginLevel(item.avgMargin);
                return (
                  <tr key={item.marketType}>
                    <td><strong>{MARKET_LABELS[item.marketType] || item.marketType}</strong></td>
                    <td>{item.avgMargin.toFixed(2)}%</td>
                    <td>{item.minMargin?.toFixed(1) || '—'}%</td>
                    <td>{item.maxMargin?.toFixed(1) || '—'}%</td>
                    <td>
                      <div className="margin-bar">
                        <div
                          className={`margin-fill ${level}`}
                          style={{ width: `${Math.min(item.avgMargin * 8, 100)}%` }}
                        />
                        <span className="margin-value">{item.avgMargin.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td>{item.sampleSize.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.marginByType} layout="vertical" margin={{ left: 80, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                type="number"
                domain={[0, 10]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 12, fill: '#6b7280' }}
              />
              <YAxis
                type="category"
                dataKey="marketType"
                tick={{ fontSize: 13, fill: '#374151' }}
                tickFormatter={(v) => MARKET_LABELS[v] || v}
                width={75}
              />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(2)}%`, 'Маржа']}
                labelFormatter={(label) => MARKET_LABELS[label] || label}
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
              />
              <Bar dataKey="avgMargin" radius={[0, 6, 6, 0]}>
                {data.marginByType.map((entry, index) => (
                  <Cell key={index} fill={COLORS[getMarginLevel(entry.avgMargin)]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="legend">
          <div className="legend-item">
            <div className="legend-dot low" />
            <span>Низкая (&lt;5%)</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot medium" />
            <span>Средняя (5-7%)</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot high" />
            <span>Высокая (&gt;7%)</span>
          </div>
        </div>
      </div>

      {/* Pros & Cons */}
      <div className="card">
        <h2>Преимущества и недостатки</h2>
        <div className="pros-cons-grid">
          <div className="pros-card">
            <h3>Преимущества</h3>
            <ul className="feature-list">
              <li>Широкая линия — {data.totalSports} видов спорта</li>
              <li>Большой выбор рынков — {data.totalMarkets.toLocaleString()}+</li>
              <li>Низкая маржа на форы — {data.marginByType.find(m => m.marketType === 'HANDICAP')?.avgMargin.toFixed(1) || '4.2'}%</li>
              <li>Лицензия ФНС России</li>
              <li>Мобильные приложения iOS и Android</li>
              <li>Live-ставки с видеотрансляциями</li>
            </ul>
          </div>
          <div className="cons-card">
            <h3>Недостатки</h3>
            <ul className="feature-list">
              <li>Высокая маржа на экзотические рынки</li>
              <li>Ограничения для новых игроков</li>
              <li>Обязательная верификация документов</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Sports */}
      <div className="card">
        <h2>Виды спорта ({data.sports.length})</h2>
        <div className="sports-grid">
          {data.sports.map((sport) => {
            const level = getMarginLevel(sport.avgMargin);
            return (
              <div className="sport-card" key={sport.id}>
                <div className="sport-header">
                  <div className="sport-icon">{SPORT_ICONS[sport.name] || '🎯'}</div>
                  <span className="sport-name">{sport.name}</span>
                </div>
                <div className="sport-stats">
                  <span>{sport.eventsCount} событий</span>
                  <span>{sport.marketsCount.toLocaleString()} рынков</span>
                  <span className={`sport-margin ${level}`}>{sport.avgMargin.toFixed(1)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* History */}
      <div className="card">
        <h2>История обновлений</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Время</th>
                <th>Статус</th>
                <th>Спорты</th>
                <th>События</th>
                <th>Рынки</th>
              </tr>
            </thead>
            <tbody>
              {data.recentSessions.map((session) => (
                <tr key={session.id}>
                  <td>{formatShortDate(session.started_at)}</td>
                  <td>
                    <span className={`status-badge ${session.status}`}>
                      {session.status === 'completed' && 'Завершено'}
                      {session.status === 'running' && 'В процессе'}
                      {session.status === 'failed' && 'Ошибка'}
                    </span>
                  </td>
                  <td>{session.sports_count}</td>
                  <td>{session.events_count.toLocaleString()}</td>
                  <td>{session.markets_count.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Company Info */}
      <div className="card">
        <h2>О букмекере</h2>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Компания</span>
            <span className="info-value">ООО «Винлайн»</span>
          </div>
          <div className="info-item">
            <span className="info-label">Лицензия</span>
            <span className="info-value">ФНС России №28</span>
          </div>
          <div className="info-item">
            <span className="info-label">Год основания</span>
            <span className="info-value">2009</span>
          </div>
          <div className="info-item">
            <span className="info-label">Сайт</span>
            <span className="info-value">
              <a href="https://winline.ru" target="_blank" rel="noopener noreferrer">winline.ru</a>
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Мин. депозит</span>
            <span className="info-value">100 ₽</span>
          </div>
          <div className="info-item">
            <span className="info-label">Мин. ставка</span>
            <span className="info-value">10 ₽</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <p>
          Данные собираются автоматически каждый час
          <br />
          © {new Date().getFullYear()} Winline Review
        </p>
      </footer>
    </div>
  );
}
