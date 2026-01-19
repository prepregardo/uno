import Link from 'next/link';
import { getAllBookmakers } from '@/lib/content';
import './home.css';

export const revalidate = 60;

export default function HomePage() {
  const bookmakers = getAllBookmakers();
  const topBookmakers = bookmakers.slice(0, 5);

  const totalBookmakers = bookmakers.length;
  const avgRating = (bookmakers.reduce((sum, b) => sum + b.rating, 0) / bookmakers.length).toFixed(1);
  const countriesCount = new Set(bookmakers.map(b => b.country)).size;

  return (
    <div className="container">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">Крупнейший ресурс о ставках</div>
          <h1>Рейтинг Букмекеров</h1>
          <p className="subtitle">
            Честные обзоры, объективные рейтинги и актуальные данные.
            <br />
            Создано игроками для игроков.
          </p>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">{totalBookmakers}</span>
              <span className="hero-stat-label">букмекеров</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">{countriesCount}</span>
              <span className="hero-stat-label">стран</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">{avgRating}</span>
              <span className="hero-stat-label">средний рейтинг</span>
            </div>
          </div>
          <div className="hero-buttons">
            <Link href="/bookmakers" className="btn btn-primary">
              Смотреть рейтинг
            </Link>
          </div>
        </div>
      </section>

      {/* Main Navigation Cards */}
      <section className="nav-section">
        <h2>Разделы сайта</h2>
        <div className="nav-grid">
          <Link href="/bookmakers" className="nav-card nav-card-featured">
            <div className="nav-card-icon">🏆</div>
            <div className="nav-card-content">
              <h3>Рейтинг букмекеров</h3>
              <p>
                {totalBookmakers} букмекерских контор с подробными обзорами,
                фильтрами и сортировкой по рейтингу, марже и другим параметрам
              </p>
              <div className="nav-card-tags">
                <span className="home-tag">Фильтры</span>
                <span className="home-tag">Сортировка</span>
                <span className="home-tag">Сравнение</span>
              </div>
            </div>
            <div className="nav-card-arrow">→</div>
          </Link>

          <div className="nav-card nav-card-coming">
            <div className="nav-card-icon">📊</div>
            <div className="nav-card-content">
              <h3>Анализ маржи</h3>
              <p>
                Сравнение коэффициентов и маржи букмекеров в реальном времени.
                Данные обновляются автоматически.
              </p>
              <span className="coming-badge">Скоро</span>
            </div>
          </div>

          <div className="nav-card nav-card-coming">
            <div className="nav-card-icon">🎁</div>
            <div className="nav-card-content">
              <h3>Бонусы и акции</h3>
              <p>
                Актуальные бонусы, фрибеты и промокоды от всех букмекеров.
                Только проверенные предложения.
              </p>
              <span className="coming-badge">Скоро</span>
            </div>
          </div>

          <div className="nav-card nav-card-coming">
            <div className="nav-card-icon">📚</div>
            <div className="nav-card-content">
              <h3>База знаний</h3>
              <p>
                Учебники, энциклопедия и глоссарий для начинающих и опытных
                игроков. Стратегии и советы.
              </p>
              <span className="coming-badge">Скоро</span>
            </div>
          </div>
        </div>
      </section>

      {/* Top Bookmakers Preview */}
      <section className="top-section">
        <div className="section-header">
          <h2>Топ букмекеров</h2>
          <Link href="/bookmakers" className="section-link">
            Все букмекеры →
          </Link>
        </div>
        <div className="top-list">
          {topBookmakers.map((bk, index) => (
            <Link href={`/bookmakers/${bk.slug}`} key={bk.slug} className="top-card">
              <div className="top-rank">#{index + 1}</div>
              <div className="top-logo">{bk.logo}</div>
              <div className="top-info">
                <h4>{bk.name}</h4>
                <p>{bk.country}</p>
              </div>
              <div className="top-stats">
                <div className="top-stat">
                  <span className="top-stat-value rating">{bk.rating}</span>
                  <span className="top-stat-label">Рейтинг</span>
                </div>
                <div className="top-stat">
                  <span className="top-stat-value margin">{bk.avgMargin}%</span>
                  <span className="top-stat-label">Маржа</span>
                </div>
              </div>
              <div className="top-arrow">→</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Brand Values */}
      <section className="values-section">
        <h2>Наши принципы</h2>
        <div className="values-grid">
          <div className="value-card">
            <div className="value-icon">✓</div>
            <h4>Честность</h4>
            <p>Мы говорим правду и не приукрашиваем. Все оценки прозрачны.</p>
          </div>
          <div className="value-card">
            <div className="value-icon">📐</div>
            <h4>Объективность</h4>
            <p>Методология опубликована и доступна. Никаких субъективных суждений.</p>
          </div>
          <div className="value-card">
            <div className="value-icon">📈</div>
            <h4>Данные</h4>
            <p>Каждая оценка основана на реальных данных и метриках.</p>
          </div>
          <div className="value-card">
            <div className="value-icon">🎮</div>
            <h4>Для игроков</h4>
            <p>Сделано игроками для игроков. Мы понимаем ваши потребности.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>
          Рейтинг Букмекеров — честные обзоры и объективные оценки
          <br />
          © {new Date().getFullYear()} РБ. Все права защищены.
        </p>
      </footer>
    </div>
  );
}
