'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

interface Bookmaker {
  slug: string;
  name: string;
  logo: string;
  rating: number;
  description: string;
  country: string;
  avgMargin: number;
  sportsCount: number;
  liveBetting: boolean;
  mobileApp: boolean;
  cashOut: boolean;
  streaming: boolean;
  minDeposit: string;
  founded: number;
}

// Данные загружаются статически при билде
import bookmakersData from '@/content/bookmakers.json';

const COUNTRIES = ['Все', 'Россия', 'Великобритания', 'Кипр', 'Мальта', 'Австрия', 'Швеция', 'Украина', 'Казахстан'];

export default function BookmakersPage() {
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('Все');
  const [minRating, setMinRating] = useState(0);
  const [maxMargin, setMaxMargin] = useState(10);
  const [features, setFeatures] = useState({
    liveBetting: false,
    mobileApp: false,
    cashOut: false,
    streaming: false,
  });
  const [sortBy, setSortBy] = useState<'rating' | 'margin' | 'name' | 'founded'>('rating');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const bookmakers = bookmakersData.bookmakers as Bookmaker[];

  const filtered = useMemo(() => {
    let result = bookmakers.filter(b => {
      // Поиск
      if (search && !b.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      // Страна
      if (country !== 'Все' && b.country !== country) {
        return false;
      }
      // Рейтинг
      if (b.rating < minRating) {
        return false;
      }
      // Маржа
      if (b.avgMargin > maxMargin) {
        return false;
      }
      // Фичи
      if (features.liveBetting && !b.liveBetting) return false;
      if (features.mobileApp && !b.mobileApp) return false;
      if (features.cashOut && !b.cashOut) return false;
      if (features.streaming && !b.streaming) return false;

      return true;
    });

    // Сортировка
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'rating':
          comparison = a.rating - b.rating;
          break;
        case 'margin':
          comparison = a.avgMargin - b.avgMargin;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'founded':
          comparison = a.founded - b.founded;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [bookmakers, search, country, minRating, maxMargin, features, sortBy, sortOrder]);

  const toggleFeature = (key: keyof typeof features) => {
    setFeatures(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="container">
      {/* Header */}
      <header className="page-header">
        <Link href="/" className="back-link">← На главную</Link>
        <h1>Рейтинг букмекеров</h1>
        <p className="subtitle">{bookmakers.length} букмекерских контор в базе</p>
      </header>

      {/* Filters */}
      <div className="filters-card">
        <div className="filters-row">
          {/* Search */}
          <div className="filter-group">
            <label>Поиск</label>
            <input
              type="text"
              placeholder="Название БК..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="filter-input"
            />
          </div>

          {/* Country */}
          <div className="filter-group">
            <label>Страна</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="filter-select"
            >
              {COUNTRIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Min Rating */}
          <div className="filter-group">
            <label>Мин. рейтинг: {minRating}</label>
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={minRating}
              onChange={(e) => setMinRating(parseFloat(e.target.value))}
              className="filter-range"
            />
          </div>

          {/* Max Margin */}
          <div className="filter-group">
            <label>Макс. маржа: {maxMargin}%</label>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={maxMargin}
              onChange={(e) => setMaxMargin(parseFloat(e.target.value))}
              className="filter-range"
            />
          </div>
        </div>

        {/* Features */}
        <div className="features-row">
          <button
            className={`feature-btn ${features.liveBetting ? 'active' : ''}`}
            onClick={() => toggleFeature('liveBetting')}
          >
            Live-ставки
          </button>
          <button
            className={`feature-btn ${features.mobileApp ? 'active' : ''}`}
            onClick={() => toggleFeature('mobileApp')}
          >
            Приложение
          </button>
          <button
            className={`feature-btn ${features.cashOut ? 'active' : ''}`}
            onClick={() => toggleFeature('cashOut')}
          >
            Кэшаут
          </button>
          <button
            className={`feature-btn ${features.streaming ? 'active' : ''}`}
            onClick={() => toggleFeature('streaming')}
          >
            Трансляции
          </button>
        </div>

        {/* Sort */}
        <div className="sort-row">
          <span>Сортировка:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="sort-select"
          >
            <option value="rating">По рейтингу</option>
            <option value="margin">По марже</option>
            <option value="name">По названию</option>
            <option value="founded">По году</option>
          </select>
          <button
            className="sort-order-btn"
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'desc' ? '↓' : '↑'}
          </button>
          <span className="results-count">Найдено: {filtered.length}</span>
        </div>
      </div>

      {/* List */}
      <div className="bookmakers-list">
        {filtered.map((bk, index) => (
          <Link href={`/bookmakers/${bk.slug}`} key={bk.slug} className="bookmaker-card">
            <div className="bk-rank">#{index + 1}</div>
            <div className="bk-logo">{bk.logo}</div>
            <div className="bk-info">
              <h2>{bk.name}</h2>
              <p>{bk.description}</p>
              <div className="bk-tags">
                <span className="tag country">{bk.country}</span>
                {bk.liveBetting && <span className="tag">Live</span>}
                {bk.mobileApp && <span className="tag">App</span>}
                {bk.cashOut && <span className="tag">CashOut</span>}
                {bk.streaming && <span className="tag">TV</span>}
              </div>
            </div>
            <div className="bk-stats">
              <div className="stat">
                <span className="stat-value rating">{bk.rating}</span>
                <span className="stat-label">Рейтинг</span>
              </div>
              <div className="stat">
                <span className="stat-value margin">{bk.avgMargin}%</span>
                <span className="stat-label">Маржа</span>
              </div>
              <div className="stat">
                <span className="stat-value">{bk.sportsCount}</span>
                <span className="stat-label">Видов спорта</span>
              </div>
            </div>
            <div className="bk-arrow">→</div>
          </Link>
        ))}

        {filtered.length === 0 && (
          <div className="no-results">
            <p>Букмекеры не найдены</p>
            <button onClick={() => {
              setSearch('');
              setCountry('Все');
              setMinRating(0);
              setMaxMargin(10);
              setFeatures({ liveBetting: false, mobileApp: false, cashOut: false, streaming: false });
            }}>
              Сбросить фильтры
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 24px;
        }

        .page-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .back-link {
          display: inline-block;
          color: rgba(255, 255, 255, 0.5);
          text-decoration: none;
          margin-bottom: 16px;
          font-size: 14px;
          transition: color 0.3s;
        }

        .back-link:hover {
          color: white;
        }

        .page-header h1 {
          font-size: 48px;
          font-weight: 700;
          background: linear-gradient(135deg, #fff, #22d3ee, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 8px;
        }

        .subtitle {
          color: rgba(255, 255, 255, 0.6);
          font-size: 18px;
        }

        .filters-card {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 24px;
          margin-bottom: 32px;
        }

        .filters-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 20px;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .filter-group label {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 500;
        }

        .filter-input,
        .filter-select {
          padding: 12px 16px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: white;
          font-size: 15px;
        }

        .filter-input:focus,
        .filter-select:focus {
          outline: none;
          border-color: rgba(34, 211, 238, 0.5);
        }

        .filter-range {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: rgba(255, 255, 255, 0.1);
          appearance: none;
          cursor: pointer;
        }

        .filter-range::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #22d3ee, #3b82f6);
          cursor: pointer;
        }

        .features-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .feature-btn {
          padding: 10px 20px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 20px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .feature-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .feature-btn.active {
          background: rgba(34, 197, 94, 0.2);
          border-color: rgba(34, 197, 94, 0.4);
          color: #4ade80;
        }

        .sort-row {
          display: flex;
          align-items: center;
          gap: 12px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
        }

        .sort-select {
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: white;
          font-size: 14px;
        }

        .sort-order-btn {
          width: 36px;
          height: 36px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          color: white;
          font-size: 18px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .sort-order-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .results-count {
          margin-left: auto;
          color: rgba(255, 255, 255, 0.5);
        }

        .bookmakers-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .bookmaker-card {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 24px;
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          text-decoration: none;
          color: white;
          transition: all 0.3s ease;
        }

        .bookmaker-card:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateX(8px);
        }

        .bk-rank {
          font-size: 24px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.3);
          min-width: 50px;
        }

        .bk-logo {
          font-size: 48px;
          width: 70px;
          text-align: center;
        }

        .bk-info {
          flex: 1;
        }

        .bk-info h2 {
          font-size: 22px;
          font-weight: 600;
          margin-bottom: 6px;
        }

        .bk-info p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
          margin-bottom: 10px;
        }

        .bk-tags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .tag {
          padding: 4px 10px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
        }

        .tag.country {
          background: rgba(59, 130, 246, 0.2);
          color: #60a5fa;
        }

        .bk-stats {
          display: flex;
          gap: 24px;
        }

        .stat {
          text-align: center;
        }

        .stat-value {
          display: block;
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .stat-value.rating {
          color: #fbbf24;
        }

        .stat-value.margin {
          color: #4ade80;
        }

        .stat-label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
        }

        .bk-arrow {
          font-size: 24px;
          color: rgba(255, 255, 255, 0.3);
          transition: all 0.3s;
        }

        .bookmaker-card:hover .bk-arrow {
          color: white;
          transform: translateX(4px);
        }

        .no-results {
          text-align: center;
          padding: 60px;
          color: rgba(255, 255, 255, 0.5);
        }

        .no-results button {
          margin-top: 16px;
          padding: 12px 24px;
          background: rgba(59, 130, 246, 0.2);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 10px;
          color: #60a5fa;
          cursor: pointer;
          transition: all 0.3s;
        }

        .no-results button:hover {
          background: rgba(59, 130, 246, 0.3);
        }

        @media (max-width: 1024px) {
          .filters-row {
            grid-template-columns: repeat(2, 1fr);
          }

          .bk-stats {
            flex-direction: column;
            gap: 12px;
          }
        }

        @media (max-width: 768px) {
          .page-header h1 {
            font-size: 32px;
          }

          .filters-row {
            grid-template-columns: 1fr;
          }

          .bookmaker-card {
            flex-wrap: wrap;
            padding: 16px;
          }

          .bk-rank {
            display: none;
          }

          .bk-info {
            width: 100%;
            order: 2;
          }

          .bk-stats {
            flex-direction: row;
            width: 100%;
            justify-content: space-around;
            order: 3;
            padding-top: 16px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          }

          .bk-arrow {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
