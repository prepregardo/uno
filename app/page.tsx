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
const MARKET_TYPE_LABELS: Record<string, string> = {
  '1X2': 'Исход (1X2)',
  TOTAL: 'Тоталы',
  HANDICAP: 'Форы',
  BOTH_SCORE: 'Обе забьют',
  DOUBLE_CHANCE: 'Двойной шанс',
  CORRECT_SCORE: 'Точный счёт',
  OTHER: 'Прочие',
};

const MARGIN_COLORS = {
  low: '#2d8a2d',
  medium: '#c9a227',
  high: '#b84444',
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
    { marketType: '1X2', avgMargin: 5.2, minMargin: 4.1, maxMargin: 6.8, sampleSize: 2847 },
    { marketType: 'TOTAL', avgMargin: 4.8, minMargin: 3.9, maxMargin: 5.9, sampleSize: 3562 },
    { marketType: 'HANDICAP', avgMargin: 4.2, minMargin: 3.2, maxMargin: 5.4, sampleSize: 2891 },
    { marketType: 'BOTH_SCORE', avgMargin: 6.5, minMargin: 5.2, maxMargin: 8.1, sampleSize: 1243 },
    { marketType: 'DOUBLE_CHANCE', avgMargin: 7.8, minMargin: 6.1, maxMargin: 9.5, sampleSize: 987 },
  ],
  recentSessions: [
    {
      id: 1,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      status: 'completed',
      sports_count: 10,
      events_count: 2874,
      markets_count: 18453,
    },
    {
      id: 2,
      started_at: new Date(Date.now() - 3600000).toISOString(),
      completed_at: new Date(Date.now() - 3600000).toISOString(),
      status: 'completed',
      sports_count: 10,
      events_count: 2756,
      markets_count: 17987,
    },
    {
      id: 3,
      started_at: new Date(Date.now() - 7200000).toISOString(),
      completed_at: new Date(Date.now() - 7200000).toISOString(),
      status: 'completed',
      sports_count: 10,
      events_count: 2698,
      markets_count: 17654,
    },
  ],
};

// ============ УТИЛИТЫ ============
function getMarginLevel(margin: number): 'low' | 'medium' | 'high' {
  if (margin < 5) return 'low';
  if (margin < 7) return 'medium';
  return 'high';
}

function getMarginColor(margin: number): string {
  return MARGIN_COLORS[getMarginLevel(margin)];
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

// ============ КОМПОНЕНТЫ ============

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="stat-card">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

function MarginBar({ margin }: { margin: number }) {
  const level = getMarginLevel(margin);
  const width = Math.min(margin * 8, 100);

  return (
    <div className="margin-bar">
      <div className={`margin-fill ${level}`} style={{ width: `${width}%` }} />
      <span className="margin-value">{margin.toFixed(1)}%</span>
    </div>
  );
}

function MarginChart({ data }: { data: MarginData[] }) {
  return (
    <div style={{ height: 300, marginTop: 20 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 100 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
          <XAxis
            type="number"
            domain={[0, 12]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            type="category"
            dataKey="marketType"
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => MARKET_TYPE_LABELS[v] || v}
            width={90}
          />
          <Tooltip
            formatter={(value: number) => [`${value.toFixed(2)}%`, 'Маржа']}
            labelFormatter={(label) => MARKET_TYPE_LABELS[label] || label}
          />
          <Bar dataKey="avgMargin" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={getMarginColor(entry.avgMargin)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function SportCard({ sport }: { sport: Sport }) {
  const level = getMarginLevel(sport.avgMargin);
  return (
    <div className="sport-card">
      <div className="sport-name">{sport.name}</div>
      <div className="sport-stats">
        <span>{sport.eventsCount} событий</span>
        <span>{sport.marketsCount} рынков</span>
        <span className={level}>{sport.avgMargin.toFixed(1)}%</span>
      </div>
    </div>
  );
}

function SessionRow({ session }: { session: Session }) {
  return (
    <tr>
      <td>{formatShortDate(session.started_at)}</td>
      <td>
        <span className={`session-status ${session.status}`}>
          {session.status === 'completed' && '✓ Завершено'}
          {session.status === 'running' && '⟳ В процессе'}
          {session.status === 'failed' && '✗ Ошибка'}
        </span>
      </td>
      <td>{session.sports_count}</td>
      <td>{session.events_count.toLocaleString()}</td>
      <td>{session.markets_count.toLocaleString()}</td>
    </tr>
  );
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
      <div className="wireframe-container">
        <div className="wireframe-block" data-block="loading">
          <p style={{ textAlign: 'center', padding: 40 }}>Загрузка данных...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const avgMargin =
    data.marginByType.length > 0
      ? data.marginByType.reduce((sum, m) => sum + m.avgMargin, 0) / data.marginByType.length
      : 0;

  return (
    <div className="wireframe-container">
      {/* Hero */}
      <div className="wireframe-block" data-block="hero">
        <div className="hero">
          <div className="hero-logo">
            <span style={{ fontSize: 32 }}>W</span>
            <br />
            Winline
          </div>
          <div className="hero-content">
            <h1>Обзор Winline</h1>
            <p>Автоматизированный анализ букмекерской конторы</p>
            <div className="hero-rating">★★★★☆ 4.2/5</div>
            <a
              href="https://winline.ru"
              target="_blank"
              rel="noopener noreferrer"
              className="hero-cta"
            >
              Перейти на сайт →
            </a>
          </div>
        </div>
      </div>

      {/* Метаданные */}
      <div className="last-update">
        {isDemo && (
          <span style={{ color: MARGIN_COLORS.medium, marginRight: 10 }}>
            [Демо-данные]
          </span>
        )}
        Обновлено: {formatDate(data.lastUpdate)}
      </div>

      {/* Статистика */}
      <div className="wireframe-block" data-block="stats">
        <h2>Статистика линии</h2>
        <div className="stats-grid">
          <StatCard value={data.totalSports} label="Видов спорта" />
          <StatCard value={data.totalEvents.toLocaleString()} label="Событий" />
          <StatCard value={data.totalMarkets.toLocaleString()} label="Рынков" />
          <StatCard value={`${avgMargin.toFixed(1)}%`} label="Средняя маржа" />
        </div>
      </div>

      {/* Анализ маржи */}
      <div className="wireframe-block" data-block="margin">
        <h2>Анализ маржи по типам ставок</h2>

        <table className="wireframe-table">
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
            {data.marginByType.map((item) => (
              <tr key={item.marketType}>
                <td>
                  <strong>{MARKET_TYPE_LABELS[item.marketType] || item.marketType}</strong>
                </td>
                <td>{item.avgMargin.toFixed(2)}%</td>
                <td>{item.minMargin?.toFixed(1) || '—'}%</td>
                <td>{item.maxMargin?.toFixed(1) || '—'}%</td>
                <td>
                  <MarginBar margin={item.avgMargin} />
                </td>
                <td>{item.sampleSize.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <MarginChart data={data.marginByType} />

        <div
          style={{
            marginTop: 15,
            padding: 10,
            background: '#f9f9f9',
            border: '1px solid #ddd',
            fontSize: 12,
          }}
        >
          <strong>Легенда:</strong>
          <span style={{ color: MARGIN_COLORS.low, marginLeft: 15 }}>■ Низкая (&lt;5%)</span>
          <span style={{ color: MARGIN_COLORS.medium, marginLeft: 15 }}>■ Средняя (5-7%)</span>
          <span style={{ color: MARGIN_COLORS.high, marginLeft: 15 }}>■ Высокая (&gt;7%)</span>
        </div>
      </div>

      {/* Плюсы и минусы */}
      <div className="wireframe-block" data-block="pros-cons">
        <h2>Плюсы и минусы</h2>
        <div className="pros-cons">
          <div>
            <h3>Преимущества</h3>
            <ul className="pros-list">
              <li>Широкая линия ({data.totalSports} видов спорта)</li>
              <li>Большой выбор рынков ({data.totalMarkets.toLocaleString()}+)</li>
              <li>Низкая маржа на форы ({data.marginByType.find(m => m.marketType === 'HANDICAP')?.avgMargin.toFixed(1) || '4.2'}%)</li>
              <li>Лицензия ФНС России</li>
              <li>Мобильные приложения iOS/Android</li>
              <li>Live-ставки с видеотрансляциями</li>
            </ul>
          </div>
          <div>
            <h3>Недостатки</h3>
            <ul className="cons-list">
              <li>Высокая маржа на экзотические рынки</li>
              <li>Ограничения для новых игроков</li>
              <li>Обязательная верификация</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Виды спорта */}
      <div className="wireframe-block" data-block="sports">
        <h2>Виды спорта ({data.sports.length})</h2>
        <div className="sports-list">
          {data.sports.map((sport) => (
            <SportCard key={sport.id} sport={sport} />
          ))}
        </div>
      </div>

      {/* История парсинга */}
      <div className="wireframe-block" data-block="history">
        <h2>История сбора данных</h2>
        <table className="wireframe-table">
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
            {data.recentSessions.length > 0 ? (
              data.recentSessions.map((session) => (
                <SessionRow key={session.id} session={session} />
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center' }}>
                  Нет данных о сессиях
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Информация */}
      <div className="wireframe-block" data-block="info">
        <h2>О букмекере</h2>
        <table className="wireframe-table">
          <tbody>
            <tr>
              <td style={{ width: 200 }}>
                <strong>Компания</strong>
              </td>
              <td>ООО «Винлайн»</td>
            </tr>
            <tr>
              <td>
                <strong>Лицензия</strong>
              </td>
              <td>ФНС России №28</td>
            </tr>
            <tr>
              <td>
                <strong>Год основания</strong>
              </td>
              <td>2009</td>
            </tr>
            <tr>
              <td>
                <strong>Сайт</strong>
              </td>
              <td>
                <a href="https://winline.ru" target="_blank" rel="noopener noreferrer">
                  winline.ru
                </a>
              </td>
            </tr>
            <tr>
              <td>
                <strong>Мин. депозит</strong>
              </td>
              <td>100 ₽</td>
            </tr>
            <tr>
              <td>
                <strong>Мин. ставка</strong>
              </td>
              <td>10 ₽</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Футер */}
      <div className="wireframe-block" data-block="footer">
        <p style={{ textAlign: 'center', fontSize: 12, color: '#666' }}>
          Данные собираются автоматически.
          <br />
          Wireframe-версия обзора • {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
