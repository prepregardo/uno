'use client';

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

// ============ ТИПЫ ============
interface Bookmaker {
  name: string;
  website: string;
  rating: number;
  description: string;
  license: string;
  founded: number;
  minDeposit: string;
  minBet: string;
  company: string;
  pros: string[];
  cons: string[];
}

interface MarginType {
  marketType: string;
  avgMargin: number;
  minMargin: number;
  maxMargin: number;
  sampleSize: number;
}

interface Sport {
  name: string;
  icon: string;
  eventsCount: number;
  marketsCount: number;
  avgMargin: number;
  order: number;
}

interface SiteContent {
  bookmaker: Bookmaker;
  margins: MarginType[];
  sports: Sport[];
}

interface DashboardProps {
  content: SiteContent;
  buildTime: string;
}

// ============ КОНСТАНТЫ ============
const MARKET_LABELS: Record<string, string> = {
  '1X2': 'Исход (1X2)',
  TOTAL: 'Тоталы',
  HANDICAP: 'Форы',
  BOTH_SCORE: 'Обе забьют',
  DOUBLE_CHANCE: 'Двойной шанс',
};

const COLORS = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
};

// ============ УТИЛИТЫ ============
function getMarginLevel(margin: number): 'low' | 'medium' | 'high' {
  if (margin < 5) return 'low';
  if (margin < 7) return 'medium';
  return 'high';
}

function renderStars(rating: number): string {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  let stars = '★'.repeat(fullStars);
  if (hasHalfStar && fullStars < 5) stars += '☆';
  stars += '☆'.repeat(5 - fullStars - (hasHalfStar ? 1 : 0));
  return stars;
}

// ============ ГЛАВНЫЙ КОМПОНЕНТ ============
export default function Dashboard({ content, buildTime }: DashboardProps) {
  const { bookmaker, margins, sports } = content;

  const totalEvents = sports.reduce((sum, s) => sum + s.eventsCount, 0);
  const totalMarkets = sports.reduce((sum, s) => sum + s.marketsCount, 0);
  const avgMargin = margins.length > 0
    ? margins.reduce((sum, m) => sum + m.avgMargin, 0) / margins.length
    : 0;

  return (
    <div className="container">
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <h1>{bookmaker.name}</h1>
          <p className="subtitle">{bookmaker.description}</p>
          <div className="hero-rating">
            <span className="stars">{renderStars(bookmaker.rating)}</span>
            <span style={{ fontSize: '20px', marginLeft: '8px' }}>{bookmaker.rating} / 5</span>
          </div>
          <a href={bookmaker.website} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            Перейти на сайт
          </a>
        </div>
      </section>

      {/* Last Update */}
      <div className="last-update">
        <span className="static-badge">Статическая страница</span>
        Сгенерировано: {buildTime}
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <span className="stat-value">{sports.length}</span>
          <span className="stat-label">Видов спорта</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <span className="stat-value">{totalEvents.toLocaleString()}</span>
          <span className="stat-label">Событий</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <span className="stat-value">{totalMarkets.toLocaleString()}</span>
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
              {margins.map((item) => {
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
            <BarChart data={margins} layout="vertical" margin={{ left: 80, right: 20 }}>
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
                {margins.map((entry, index) => (
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
              {bookmaker.pros.map((pro, i) => (
                <li key={i}>{pro}</li>
              ))}
            </ul>
          </div>
          <div className="cons-card">
            <h3>Недостатки</h3>
            <ul className="feature-list">
              {bookmaker.cons.map((con, i) => (
                <li key={i}>{con}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Sports */}
      <div className="card">
        <h2>Виды спорта ({sports.length})</h2>
        <div className="sports-grid">
          {sports.map((sport, index) => {
            const level = getMarginLevel(sport.avgMargin);
            return (
              <div className="sport-card" key={index}>
                <div className="sport-header">
                  <div className="sport-icon">{sport.icon}</div>
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

      {/* Company Info */}
      <div className="card">
        <h2>О букмекере</h2>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Компания</span>
            <span className="info-value">{bookmaker.company}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Лицензия</span>
            <span className="info-value">{bookmaker.license}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Год основания</span>
            <span className="info-value">{bookmaker.founded}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Сайт</span>
            <span className="info-value">
              <a href={bookmaker.website} target="_blank" rel="noopener noreferrer">
                {bookmaker.website.replace('https://', '')}
              </a>
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Мин. депозит</span>
            <span className="info-value">{bookmaker.minDeposit}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Мин. ставка</span>
            <span className="info-value">{bookmaker.minBet}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <p>
          Статическая страница — максимальная скорость загрузки
          <br />
          © {new Date().getFullYear()} {bookmaker.name} Review
        </p>
      </footer>
    </div>
  );
}
