'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface DashboardData {
  lastUpdate: string;
  totalSports: number;
  totalEvents: number;
  totalMarkets: number;
  sports: Array<{
    id: number;
    name: string;
    eventsCount: number;
    marketsCount: number;
    avgMargin: number;
  }>;
  marginByType: Array<{
    marketType: string;
    avgMargin: number;
    sampleSize: number;
  }>;
  recentSessions: Array<{
    id: number;
    startedAt: string;
    completedAt: string;
    status: 'running' | 'completed' | 'failed';
    sportsCount: number;
    eventsCount: number;
    marketsCount: number;
  }>;
}

// Маппинг типов рынков на русский
const marketTypeLabels: Record<string, string> = {
  '1X2': 'Исход матча',
  'TOTAL': 'Тоталы',
  'HANDICAP': 'Форы',
  'BOTH_SCORE': 'Обе забьют',
  'DOUBLE_CHANCE': 'Двойной шанс',
  'CORRECT_SCORE': 'Точный счёт',
  'FIRST_GOAL': 'Первый гол',
  'OTHER': 'Прочие',
};

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    // Автообновление каждые 5 минут
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      if (!response.ok) throw new Error('Failed to fetch data');
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError('Не удалось загрузить данные. Убедитесь, что сервер запущен.');
      // Показываем демо-данные для wireframe
      setData(getDemoData());
    } finally {
      setLoading(false);
    }
  };

  const getMarginClass = (margin: number) => {
    if (margin < 5) return 'low';
    if (margin < 8) return 'medium';
    return 'high';
  };

  if (loading) {
    return (
      <div className="wireframe-container">
        <div className="wireframe-block" data-block="loading">
          <p>Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wireframe-container">
      {/* Hero секция */}
      <div className="wireframe-block" data-block="hero">
        <div className="hero">
          <div className="hero-logo">[LOGO]<br />Winline</div>
          <div className="hero-content">
            <h1>Обзор Winline</h1>
            <p>Автоматизированный анализ букмекерской компании</p>
            <div className="hero-rating">
              Общий рейтинг: {'★'.repeat(4)}{'☆'.repeat(1)} (4.2/5)
            </div>
            <button className="hero-cta">[Перейти на сайт →]</button>
          </div>
        </div>
      </div>

      {/* Последнее обновление */}
      <div className="last-update">
        Последнее обновление: {data?.lastUpdate
          ? format(new Date(data.lastUpdate), 'dd MMMM yyyy, HH:mm', { locale: ru })
          : 'Нет данных'}
        {error && <span style={{ color: 'var(--wireframe-warn)', marginLeft: '10px' }}>({error})</span>}
      </div>

      {/* Quick Stats */}
      <div className="wireframe-block" data-block="quick-stats">
        <h2>Статистика в реальном времени</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{data?.totalSports || 0}</span>
            <span className="stat-label">Видов спорта</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{data?.totalEvents || 0}</span>
            <span className="stat-label">Событий</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{data?.totalMarkets || 0}</span>
            <span className="stat-label">Рынков</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">
              {data?.marginByType?.length
                ? (data.marginByType.reduce((sum, m) => sum + m.avgMargin, 0) / data.marginByType.length).toFixed(1)
                : '0'}%
            </span>
            <span className="stat-label">Средняя маржа</span>
          </div>
        </div>
      </div>

      {/* Плюсы и минусы */}
      <div className="wireframe-block" data-block="pros-cons">
        <h2>Плюсы и минусы</h2>
        <div className="pros-cons">
          <div>
            <h3>Преимущества</h3>
            <ul className="pros-list">
              <li>Широкая линия ({data?.totalSports || 0}+ видов спорта)</li>
              <li>Большой выбор рынков ({data?.totalMarkets || 0}+)</li>
              <li>Лицензия ФНС России</li>
              <li>Мобильное приложение iOS/Android</li>
              <li>Live ставки с трансляциями</li>
            </ul>
          </div>
          <div>
            <h3>Недостатки</h3>
            <ul className="cons-list">
              <li>Маржа выше среднего на некоторых рынках</li>
              <li>Ограничения на вывод для новых игроков</li>
              <li>Верификация документов обязательна</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Маржа по типам рынков */}
      <div className="wireframe-block" data-block="margin-analysis">
        <h2>Анализ маржи по типам рынков</h2>
        {data?.marginByType && data.marginByType.length > 0 ? (
          <>
            <table className="wireframe-table">
              <thead>
                <tr>
                  <th>Тип рынка</th>
                  <th>Средняя маржа</th>
                  <th>Визуализация</th>
                  <th>Выборка</th>
                </tr>
              </thead>
              <tbody>
                {data.marginByType.map((item) => (
                  <tr key={item.marketType}>
                    <td>{marketTypeLabels[item.marketType] || item.marketType}</td>
                    <td>{item.avgMargin.toFixed(2)}%</td>
                    <td>
                      <div className="margin-bar">
                        <div
                          className={`margin-fill ${getMarginClass(item.avgMargin)}`}
                          style={{ width: `${Math.min(item.avgMargin * 5, 100)}%` }}
                        />
                        <span className="margin-value">{item.avgMargin.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td>{item.sampleSize} рынков</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* График маржи */}
            <div style={{ marginTop: '20px', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.marginByType}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                  <XAxis
                    dataKey="marketType"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => marketTypeLabels[value] || value}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    domain={[0, 15]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(2)}%`, 'Маржа']}
                    labelFormatter={(label) => marketTypeLabels[label] || label}
                  />
                  <Bar dataKey="avgMargin" fill="#666" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <div className="chart-placeholder">[График маржи - нет данных]</div>
        )}
      </div>

      {/* Виды спорта */}
      <div className="wireframe-block" data-block="sports-list">
        <h2>Виды спорта ({data?.sports?.length || 0})</h2>
        <div className="sports-list">
          {data?.sports?.slice(0, 12).map((sport) => (
            <div className="sport-card" key={sport.id}>
              <div className="sport-name">{sport.name}</div>
              <div className="sport-stats">
                <span>{sport.eventsCount} событий</span>
                <span>{sport.marketsCount} рынков</span>
                <span>
                  Маржа: <strong className={getMarginClass(sport.avgMargin)}>
                    {sport.avgMargin.toFixed(1)}%
                  </strong>
                </span>
              </div>
            </div>
          )) || (
            <>
              {['Футбол', 'Хоккей', 'Баскетбол', 'Теннис', 'Волейбол', 'Киберспорт'].map((name) => (
                <div className="sport-card" key={name}>
                  <div className="sport-name">{name}</div>
                  <div className="sport-stats">
                    <span>-- событий</span>
                    <span>-- рынков</span>
                    <span>Маржа: --%</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* История парсинга */}
      <div className="wireframe-block" data-block="scrape-history">
        <h2>История обновлений данных</h2>
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
            {data?.recentSessions?.map((session) => (
              <tr key={session.id}>
                <td>
                  {session.startedAt
                    ? format(new Date(session.startedAt), 'dd.MM.yy HH:mm')
                    : '-'}
                </td>
                <td>
                  <span className={`session-status ${session.status}`}>
                    {session.status === 'completed' && 'Завершено'}
                    {session.status === 'running' && 'В процессе'}
                    {session.status === 'failed' && 'Ошибка'}
                  </span>
                </td>
                <td>{session.sportsCount}</td>
                <td>{session.eventsCount}</td>
                <td>{session.marketsCount}</td>
              </tr>
            )) || (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center' }}>
                  Нет данных о сессиях парсинга
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Информация о компании */}
      <div className="wireframe-block" data-block="company-info">
        <h2>Информация о букмекере</h2>
        <table className="wireframe-table">
          <tbody>
            <tr>
              <td><strong>Название</strong></td>
              <td>ООО «Винлайн»</td>
            </tr>
            <tr>
              <td><strong>Лицензия</strong></td>
              <td>ФНС России №28</td>
            </tr>
            <tr>
              <td><strong>Год основания</strong></td>
              <td>2009</td>
            </tr>
            <tr>
              <td><strong>Сайт</strong></td>
              <td>winline.ru</td>
            </tr>
            <tr>
              <td><strong>Мин. депозит</strong></td>
              <td>100 ₽</td>
            </tr>
            <tr>
              <td><strong>Мин. ставка</strong></td>
              <td>10 ₽</td>
            </tr>
            <tr>
              <td><strong>Приложения</strong></td>
              <td>iOS, Android</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="wireframe-block" data-block="footer">
        <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--wireframe-accent)' }}>
          Данные собираются автоматически каждый час.<br />
          Это wireframe-версия обзора. Дизайн будет доработан.
        </p>
      </div>
    </div>
  );
}

// Демо-данные для отображения wireframe без бэкенда
function getDemoData(): DashboardData {
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
      { id: 1, startedAt: new Date().toISOString(), completedAt: new Date().toISOString(), status: 'completed', sportsCount: 25, eventsCount: 1847, marketsCount: 12453 },
      { id: 2, startedAt: new Date(Date.now() - 3600000).toISOString(), completedAt: new Date(Date.now() - 3600000).toISOString(), status: 'completed', sportsCount: 24, eventsCount: 1756, marketsCount: 11987 },
    ],
  };
}
