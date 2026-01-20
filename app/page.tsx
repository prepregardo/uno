import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import './home.css';

export const revalidate = 60;

// Загрузка списка букмекеров
function getBookmakers() {
  try {
    const filePath = path.join(process.cwd(), 'content', 'bookmakers.json');
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    return data.bookmakers || [];
  } catch {
    return [];
  }
}

export default function HomePage() {
  const bookmakers = getBookmakers();
  const topBookmakers = bookmakers.slice(0, 5);

  return (
    <div className="page-container">
      {/* Hero Section */}
      <section className="home-hero">
        <div className="home-hero-content">
          <h1>Рейтинг Букмекеров</h1>
          <p className="home-hero-subtitle">
            Честные обзоры, объективные рейтинги и актуальные данные.
            Создано игроками для игроков.
          </p>
          <div className="home-hero-stats">
            <div className="home-stat">
              <span className="home-stat-value">{bookmakers.length}</span>
              <span className="home-stat-label">букмекеров</span>
            </div>
            <div className="home-stat">
              <span className="home-stat-value">5000+</span>
              <span className="home-stat-label">отзывов</span>
            </div>
            <div className="home-stat">
              <span className="home-stat-value">100%</span>
              <span className="home-stat-label">честность</span>
            </div>
          </div>
          <Link href="/bookmakers" className="btn btn-primary btn-lg">
            Смотреть рейтинг
          </Link>
        </div>
      </section>

      {/* Navigation Cards */}
      <section className="home-nav">
        <h2 className="section-title">Разделы сайта</h2>
        <div className="home-nav-grid">
          <Link href="/bookmakers" className="home-nav-card featured">
            <span className="home-nav-icon">🏆</span>
            <div className="home-nav-content">
              <h3>Рейтинг букмекеров</h3>
              <p>{bookmakers.length} букмекерских контор с подробными обзорами и фильтрами</p>
            </div>
            <span className="home-nav-arrow">→</span>
          </Link>

          <div className="home-nav-card disabled">
            <span className="home-nav-icon">📊</span>
            <div className="home-nav-content">
              <h3>Анализ маржи</h3>
              <p>Сравнение коэффициентов в реальном времени</p>
              <span className="coming-soon">Скоро</span>
            </div>
          </div>

          <div className="home-nav-card disabled">
            <span className="home-nav-icon">🎁</span>
            <div className="home-nav-content">
              <h3>Бонусы и акции</h3>
              <p>Актуальные бонусы и промокоды</p>
              <span className="coming-soon">Скоро</span>
            </div>
          </div>

          <div className="home-nav-card disabled">
            <span className="home-nav-icon">📚</span>
            <div className="home-nav-content">
              <h3>База знаний</h3>
              <p>Учебники и стратегии</p>
              <span className="coming-soon">Скоро</span>
            </div>
          </div>
        </div>
      </section>

      {/* Top Bookmakers */}
      {topBookmakers.length > 0 && (
        <section className="home-top">
          <div className="section-header">
            <h2 className="section-title">Топ букмекеров</h2>
            <Link href="/bookmakers" className="section-link">Все букмекеры →</Link>
          </div>

          <div className="home-top-list">
            {topBookmakers.map((bk: any, idx: number) => (
              <Link href={`/bookmaker/${bk.slug}`} key={bk.slug} className="home-top-card">
                <span className="home-top-rank">#{idx + 1}</span>
                <span className="home-top-logo">{bk.logo}</span>
                <div className="home-top-info">
                  <h4>{bk.name}</h4>
                  <span className="home-top-country">{bk.country}</span>
                </div>
                <div className="home-top-stats">
                  <div className="home-top-stat">
                    <span className="home-top-stat-value">{bk.rating}</span>
                    <span className="home-top-stat-label">Рейтинг</span>
                  </div>
                  <div className="home-top-stat">
                    <span className="home-top-stat-value">{bk.avgMargin}%</span>
                    <span className="home-top-stat-label">Маржа</span>
                  </div>
                </div>
                <span className="home-top-arrow">→</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Values */}
      <section className="home-values">
        <h2 className="section-title">Наши принципы</h2>
        <div className="home-values-grid">
          <div className="home-value-card">
            <span className="home-value-icon">✓</span>
            <h4>Честность</h4>
            <p>Мы говорим правду и не приукрашиваем</p>
          </div>
          <div className="home-value-card">
            <span className="home-value-icon">📐</span>
            <h4>Объективность</h4>
            <p>Методология опубликована и доступна</p>
          </div>
          <div className="home-value-card">
            <span className="home-value-icon">📈</span>
            <h4>Данные</h4>
            <p>Каждая оценка основана на метриках</p>
          </div>
          <div className="home-value-card">
            <span className="home-value-icon">🎮</span>
            <h4>Для игроков</h4>
            <p>Сделано игроками для игроков</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <p>РБ — Рейтинг Букмекеров. Честные обзоры и объективные оценки.</p>
        <p className="home-footer-copy">© {new Date().getFullYear()} Все права защищены.</p>
      </footer>
    </div>
  );
}
