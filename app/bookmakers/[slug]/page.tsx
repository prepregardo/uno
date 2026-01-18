import { getAllBookmakers, getBookmakerBySlug } from '@/lib/content';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import './styles.css';

// Генерируем статические страницы для всех букмекеров
export async function generateStaticParams() {
  const bookmakers = getAllBookmakers();
  return bookmakers.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const bookmaker = getBookmakerBySlug(params.slug);
  if (!bookmaker) return { title: 'Букмекер не найден' };

  return {
    title: `${bookmaker.name} - Обзор букмекера | Рейтинг ${bookmaker.rating}`,
    description: bookmaker.description,
  };
}

export default function BookmakerPage({ params }: { params: { slug: string } }) {
  const bookmaker = getBookmakerBySlug(params.slug);

  if (!bookmaker) {
    notFound();
  }

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    return '★'.repeat(fullStars) + (hasHalf ? '☆' : '') + '☆'.repeat(5 - fullStars - (hasHalf ? 1 : 0));
  };

  return (
    <div className="bk-container">
      {/* Breadcrumb */}
      <nav className="bk-breadcrumb">
        <Link href="/">Главная</Link>
        <span>/</span>
        <Link href="/bookmakers">Букмекеры</Link>
        <span>/</span>
        <span>{bookmaker.name}</span>
      </nav>

      {/* Hero */}
      <section className="bk-hero">
        <div className="bk-hero-content">
          <div className="bk-hero-logo">{bookmaker.logo}</div>
          <h1>{bookmaker.name}</h1>
          <p className="bk-subtitle">{bookmaker.description}</p>
          <div className="bk-hero-rating">
            <span className="bk-stars">{renderStars(bookmaker.rating)}</span>
            <span className="bk-rating-value">{bookmaker.rating} / 5</span>
          </div>
          <a href={bookmaker.website} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            Перейти на сайт →
          </a>
        </div>
      </section>

      {/* Quick Stats */}
      <div className="bk-stats-grid">
        <div className="bk-stat-card">
          <div className="bk-stat-icon">📊</div>
          <span className="bk-stat-value">{bookmaker.avgMargin}%</span>
          <span className="bk-stat-label">Средняя маржа</span>
        </div>
        <div className="bk-stat-card">
          <div className="bk-stat-icon">🏆</div>
          <span className="bk-stat-value">{bookmaker.sportsCount}</span>
          <span className="bk-stat-label">Видов спорта</span>
        </div>
        <div className="bk-stat-card">
          <div className="bk-stat-icon">📅</div>
          <span className="bk-stat-value">{bookmaker.founded}</span>
          <span className="bk-stat-label">Год основания</span>
        </div>
        <div className="bk-stat-card">
          <div className="bk-stat-icon">🌍</div>
          <span className="bk-stat-value bk-country">{bookmaker.country}</span>
          <span className="bk-stat-label">Страна</span>
        </div>
      </div>

      {/* Features */}
      <div className="card">
        <h2>Возможности</h2>
        <div className="bk-features-grid">
          <div className={`bk-feature-item ${bookmaker.liveBetting ? 'active' : 'inactive'}`}>
            <span className="bk-feature-icon">{bookmaker.liveBetting ? '✓' : '✗'}</span>
            <span>Live-ставки</span>
          </div>
          <div className={`bk-feature-item ${bookmaker.mobileApp ? 'active' : 'inactive'}`}>
            <span className="bk-feature-icon">{bookmaker.mobileApp ? '✓' : '✗'}</span>
            <span>Мобильное приложение</span>
          </div>
          <div className={`bk-feature-item ${bookmaker.cashOut ? 'active' : 'inactive'}`}>
            <span className="bk-feature-icon">{bookmaker.cashOut ? '✓' : '✗'}</span>
            <span>Кэшаут</span>
          </div>
          <div className={`bk-feature-item ${bookmaker.streaming ? 'active' : 'inactive'}`}>
            <span className="bk-feature-icon">{bookmaker.streaming ? '✓' : '✗'}</span>
            <span>Видеотрансляции</span>
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

      {/* Company Info */}
      <div className="card">
        <h2>Информация о компании</h2>
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
            <span className="info-label">Страна</span>
            <span className="info-value">{bookmaker.country}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Год основания</span>
            <span className="info-value">{bookmaker.founded}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Мин. депозит</span>
            <span className="info-value">{bookmaker.minDeposit}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Мин. ставка</span>
            <span className="info-value">{bookmaker.minBet}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Макс. выплата</span>
            <span className="info-value">{bookmaker.maxPayout}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Сайт</span>
            <span className="info-value">
              <a href={bookmaker.website} target="_blank" rel="noopener noreferrer">
                {bookmaker.website.replace('https://', '')}
              </a>
            </span>
          </div>
        </div>
      </div>

      {/* Back to list */}
      <div className="bk-back-section">
        <Link href="/bookmakers" className="btn btn-secondary">
          ← Все букмекеры
        </Link>
      </div>
    </div>
  );
}
