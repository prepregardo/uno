import { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import './styles.css';

async function getBookmakerData(slug: string) {
  const filePath = path.join(process.cwd(), 'content', `${slug}-full.json`);
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await getBookmakerData(params.slug);
  if (!data) return { title: 'Букмекер не найден' };
  return {
    title: data.seo?.title || data.name,
    description: data.seo?.description || data.description,
  };
}

function Stars({ rating, size = 'normal' }: { rating: number; size?: 'normal' | 'small' | 'large' }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  const sizeClass = size === 'small' ? 'stars-sm' : size === 'large' ? 'stars-lg' : '';
  return (
    <div className={`stars ${sizeClass}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`star ${i < fullStars ? 'full' : i === fullStars && hasHalf ? 'half' : 'empty'}`}>★</span>
      ))}
    </div>
  );
}

function RatingBar({ value, maxValue = 10 }: { value: number; maxValue?: number }) {
  const percent = (value / maxValue) * 100;
  return (
    <div className="rating-bar">
      <div className="rating-bar-fill" style={{ width: `${percent}%` }} />
    </div>
  );
}

export default async function BookmakerPage({ params }: { params: { slug: string } }) {
  const data = await getBookmakerData(params.slug);

  if (!data) {
    return (
      <div className="bk-page">
        <div className="not-found">
          <h1>Букмекер не найден</h1>
          <p>Запрашиваемая страница не существует.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bk-page">
      <div className="bk-container">
        {/* Main Content */}
        <main className="bk-main">
          {/* Hero Card */}
          <div className="bk-card bk-hero">
            <div className="hero-top">
              <div className="hero-logo">
                <div className="logo-img">W</div>
                <div className="logo-badge">✓</div>
              </div>
              <div className="hero-content">
                <h1 className="hero-title">{data.name} БК: {data.stats.reviewsCount.toLocaleString()} отзывов, {data.navigator.bonus} бонус, жалобы, обзор</h1>
                <div className="hero-rating">
                  <Stars rating={data.navigator.rating / 2} />
                </div>
              </div>
              <a href={data.website} target="_blank" rel="noopener noreferrer" className="hero-btn">
                Перейти на сайт
              </a>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="stat-icon">💬</span>
                <span className="stat-val">{data.stats.reviewsCount.toLocaleString()}</span>
              </div>
              <div className="hero-stat">
                <span className="stat-icon">❓</span>
                <span className="stat-val">{data.stats.questionsCount}</span>
              </div>
              <div className="hero-stat">
                <span className="stat-icon">👁</span>
                <span className="stat-val">{(data.stats.viewsCount / 1000).toFixed(1)}K</span>
              </div>
              <div className="hero-stat highlight">
                <span className="stat-icon">🎁</span>
                <span className="stat-val">{data.navigator.bonus}</span>
              </div>
              <div className="hero-stat">
                <span className="stat-icon">📊</span>
                <span className="stat-val">768</span>
              </div>
              <div className="hero-stat">
                <span className="stat-icon">⚠️</span>
                <span className="stat-val">{data.stats.complaintsTotal}</span>
              </div>
            </div>
          </div>

          {/* Table of Contents */}
          <div className="bk-card bk-toc">
            <details className="toc-details">
              <summary className="toc-summary">
                <span className="toc-icon">📋</span>
                <span>Полное содержание</span>
                <span className="toc-arrow">▼</span>
              </summary>
              <div className="toc-content">
                <a href="#reviews">Отзывы</a>
                <a href="#video">Видеообзор</a>
                <a href="#rating">Оценка редакции</a>
                <a href="#bonuses">Бонусы</a>
                <a href="#questions">Вопросы</a>
                <a href="#faq">FAQ</a>
                <a href="#complaints">Жалобы</a>
                <a href="#apps">Приложения</a>
                <a href="#payments">Способы оплаты</a>
                <a href="#support">Поддержка</a>
                <a href="#reliability">Надежность</a>
                <a href="#licenses">Лицензии</a>
                <a href="#company">О компании</a>
              </div>
            </details>
          </div>

          {/* Reviews Section */}
          <section id="reviews" className="bk-card bk-reviews">
            <div className="section-head">
              <h2>Отзывы <span className="count">{data.stats.reviewsCount.toLocaleString()}</span></h2>
              <Stars rating={5} />
              <a href="#" className="link-all">Смотреть все</a>
            </div>

            <div className="reviews-filter">
              <button className="filter-btn active">
                <span className="filter-icon">👁</span>
                Показать выбранные отзывы
              </button>
            </div>

            <div className="reviews-list">
              {data.demoReviews?.slice(0, 3).map((review: any) => (
                <div key={review.id} className="review-item">
                  <div className="review-left">
                    <div className="review-avatar">{review.userName.charAt(0)}</div>
                  </div>
                  <div className="review-body">
                    <div className="review-header">
                      <span className="review-name">
                        {review.userName}
                        {review.isVerified && <span className="verified">✓</span>}
                      </span>
                      <span className="review-date">{review.date}</span>
                    </div>
                    <div className="review-stars">
                      <Stars rating={review.rating / 2} size="small" />
                      <span className="review-score">{review.rating}/10</span>
                    </div>
                    {review.title && <div className="review-title">{review.title}</div>}
                    <p className="review-text">{review.text}</p>
                    <div className="review-footer">
                      <button className="react-btn like">👍 Полезно <span>{review.likes}</span></button>
                      <button className="react-btn">💬 Ответить</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="reviews-more">
              <span>У вас есть опыт игры в этой БК?</span>
              <a href="#" className="btn-write">Написать отзыв</a>
            </div>
          </section>

          {/* Video Review */}
          {data.videoReview && (
            <section id="video" className="bk-card bk-video">
              <h2>Видеообзор БК {data.name}</h2>
              <div className="video-container">
                <iframe
                  src={`https://www.youtube.com/embed/${data.videoReview.youtubeId}`}
                  title={data.videoReview.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </section>
          )}

          {/* Editorial Rating */}
          <section id="rating" className="bk-card bk-rating">
            <div className="rating-header">
              <h2>Оценка Рейтинга Букмекеров</h2>
              <Stars rating={data.ratings.overall / 2} size="large" />
            </div>

            <div className="editor-block">
              <div className="editor-avatar">
                <img src="/images/editor.png" alt="Editor" />
              </div>
              <div className="editor-info">
                <span className="editor-label">Редакция RatingBet</span>
                <p className="editor-text">{data.editorialReview.text}</p>
              </div>
            </div>

            <div className="ratings-grid">
              {data.ratings.categories.map((cat: any, idx: number) => (
                <div key={idx} className="rating-item">
                  <div className="rating-row">
                    <span className="rating-name">{cat.name}</span>
                    <span className="rating-value">{cat.value}</span>
                  </div>
                  <RatingBar value={cat.value} maxValue={cat.maxValue} />
                </div>
              ))}
            </div>
          </section>

          {/* Bonuses */}
          <section id="bonuses" className="bk-card bk-bonuses">
            <div className="section-head">
              <h2>Бонусы: <span className="count-inline">{data.bonuses.length}</span></h2>
              <a href="#" className="link-all">Все бонусы</a>
            </div>

            <div className="bonuses-grid">
              {data.bonuses.map((bonus: any) => (
                <div key={bonus.id} className="bonus-card">
                  <div className="bonus-img">
                    <div className="bonus-logo">W</div>
                  </div>
                  <div className="bonus-info">
                    <div className="bonus-name">{bonus.title}</div>
                    <div className="bonus-desc">{bonus.description}</div>
                  </div>
                  <div className="bonus-amount">{bonus.amount}</div>
                </div>
              ))}
            </div>

            <p className="bonuses-note">
              Бонусная программа — один из способов «Лига Ставок» подчеркнуть ценность для своих клиентов как казино.
              Приветственные бонусы «Лига Ставок» прекрасно помогают привлечь новых игроков и мотивировать их зарегистрировать первый депозит.
            </p>
          </section>

          {/* Questions */}
          <section id="questions" className="bk-card bk-questions">
            <div className="section-head">
              <h2>Вопросы: <span className="count-inline">{data.stats.questionsCount}</span></h2>
              <a href="#" className="link-all">Смотреть все</a>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="bk-card bk-faq">
            <div className="section-head">
              <h2>FAQ: <span className="count-inline">{data.faq.length}</span></h2>
            </div>

            <div className="faq-list">
              {data.faq.slice(0, 5).map((item: any, idx: number) => (
                <details key={idx} className="faq-item">
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </section>

          {/* Complaints */}
          <section id="complaints" className="bk-card bk-complaints">
            <div className="section-head">
              <h2>Жалобы: <span className="count-green">{data.stats.complaintsResolved}/{data.stats.complaintsTotal}</span></h2>
              <a href="#" className="link-all">Все жалобы</a>
            </div>

            <div className="complaints-grid">
              {data.demoComplaints?.slice(0, 3).map((complaint: any) => (
                <div key={complaint.id} className="complaint-card">
                  <div className={`complaint-status ${complaint.status}`}>
                    {complaint.status === 'resolved' ? '✓' : '⏳'}
                  </div>
                  <div className="complaint-info">
                    <div className="complaint-title">{complaint.title}</div>
                    <div className="complaint-meta">
                      ID #{complaint.id} • {complaint.date}
                    </div>
                  </div>
                  <div className="complaint-amount">{complaint.amount}</div>
                </div>
              ))}
            </div>

            <div className="dispute-block">
              <h3>У вас спор с букмекером?</h3>
              <button className="btn-dispute">Открыть жалобу</button>
            </div>
          </section>

          {/* Mobile Version */}
          <section className="bk-card bk-mobile">
            <h2>Мобильная версия сайта</h2>
          </section>

          {/* Apps */}
          <section id="apps" className="bk-card bk-apps">
            <h2>Обзоры приложений</h2>

            <div className="apps-grid">
              <div className="app-card">
                <div className="app-icon ios"></div>
                <div className="app-info">
                  <div className="app-name">«{data.name}» для iOS</div>
                  <div className="app-rating">
                    <Stars rating={4.5} size="small" />
                    <span>4.7</span>
                  </div>
                </div>
              </div>
              <div className="app-card">
                <div className="app-icon android"></div>
                <div className="app-info">
                  <div className="app-name">«{data.name}» для Android</div>
                  <div className="app-rating">
                    <Stars rating={4.5} size="small" />
                    <span>4.5</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="app-description">
              <p>
                БК Winline есть и на сайте и приложение, давайте с вами познакомимся, что она подготовила вам если решите установить приложение!
                Для вас прежде всего букмекер букмекер решил создать удобный интерфейс, а также пообещал быстроту ставок и работы приложения.
              </p>

              <h4>Достоинства</h4>
              <ul className="pros-list">
                <li>Быстрота работы</li>
                <li>Live-трансляции</li>
                <li>Удобный интерфейс</li>
              </ul>

              <h4>Недостатки</h4>
              <ul className="cons-list">
                <li>Ограничения версий</li>
              </ul>

              <div className="store-buttons">
                <a href="#" className="store-btn appstore">
                  <span className="store-icon"></span>
                  <span className="store-text">
                    <small>Загрузите в</small>
                    App Store
                  </span>
                </a>
                <a href="#" className="store-btn googleplay">
                  <span className="store-icon"></span>
                  <span className="store-text">
                    <small>Доступно в</small>
                    Google Play
                  </span>
                </a>
              </div>
            </div>
          </section>

          {/* Payment Methods */}
          <section id="payments" className="bk-card bk-payments">
            <h2>Способы платежей</h2>

            <div className="payments-grid">
              {data.paymentMethods.map((method: any, idx: number) => (
                <div key={idx} className="payment-card">
                  <div className="payment-icon">{method.icon === 'visa' ? '💳' : method.icon === 'mastercard' ? '💳' : method.icon === 'mir' ? '🏦' : '💰'}</div>
                  <div className="payment-name">{method.name}</div>
                </div>
              ))}
            </div>

            <table className="payments-table">
              <thead>
                <tr>
                  <th>Способ</th>
                  <th>Депозит</th>
                  <th>Вывод</th>
                  <th>Время</th>
                </tr>
              </thead>
              <tbody>
                {data.paymentMethods.slice(0, 5).map((method: any, idx: number) => (
                  <tr key={idx}>
                    <td>{method.name}</td>
                    <td>{method.depositMin || '100 ₽'}</td>
                    <td>{method.withdrawMin || '100 ₽'}</td>
                    <td>{method.withdrawTime || 'до 24ч'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Support */}
          <section id="support" className="bk-card bk-support">
            <h2>Служба поддержки</h2>

            <p className="support-text">
              Поддержка клиентов Winline — одна из лучших на российском рынке. На сайте есть чат, e-mail, раздел помощи FAQ.
              Операторы отвечают быстро и по делу, решают вопросы оперативно.
            </p>

            <div className="support-grid">
              <div className="support-item">
                <span className="support-label">Онлайн чат</span>
                <span className="support-value green">Есть</span>
              </div>
              <div className="support-item">
                <span className="support-label">Email</span>
                <span className="support-value">{data.support.email}</span>
              </div>
              <div className="support-item">
                <span className="support-label">Телефон</span>
                <span className="support-value">{data.support.phone}</span>
              </div>
              <div className="support-item">
                <span className="support-label">Режим работы</span>
                <span className="support-value">{data.support.workingHours}</span>
              </div>
            </div>
          </section>

          {/* Reliability */}
          <section id="reliability" className="bk-card bk-reliability">
            <h2>Надежность</h2>

            <div className="reliability-grid">
              <div className="reliability-item">
                <div className="rel-icon">🏆</div>
                <div className="rel-info">
                  <div className="rel-label">Признание Winline</div>
                  <div className="rel-value">ТОП букмекер</div>
                </div>
              </div>
              <div className="reliability-item">
                <div className="rel-percent green">{data.reliability.complaintsResolvedPercent}%</div>
                <div className="rel-info">
                  <div className="rel-label">Жалоб решено</div>
                </div>
              </div>
              <div className="reliability-item">
                <div className="rel-percent">{100 - data.reliability.complaintsResolvedPercent}%</div>
                <div className="rel-info">
                  <div className="rel-label">Жалоб не решено</div>
                </div>
              </div>
            </div>
          </section>

          {/* Licenses */}
          <section id="licenses" className="bk-card bk-licenses">
            <h2>Лицензии</h2>

            <div className="license-info">
              <p>
                Об этом можно узнать на сайте «Букмекер.рф» в карточке лицензиата Букмекерской конторы (БК) «Винлайн» ИНН
                7709444674, ОГРН 1067746407264 и на сайте egrul.nalog.ru (поиск по ИНН или ОГРН организации).
              </p>
            </div>

            {data.licenses.map((license: any, idx: number) => (
              <div key={idx} className="license-item">
                <span className="license-icon">📜</span>
                <span className="license-text">{license.name} — {license.number}</span>
              </div>
            ))}
          </section>

          {/* Organization */}
          <section className="bk-card bk-org">
            <h2>Организация</h2>
          </section>

          {/* Rating History */}
          <section className="bk-card bk-history">
            <h2>История оценок</h2>
          </section>

          {/* Company Info */}
          <section id="company" className="bk-card bk-company">
            <h2>Информация о компании</h2>

            <div className="company-table">
              <div className="company-row">
                <span className="company-label">Юридическое название</span>
                <span className="company-value">{data.company.legalName}</span>
              </div>
              <div className="company-row">
                <span className="company-label">ОГРН</span>
                <span className="company-value">{data.company.registrationNumber}</span>
              </div>
              <div className="company-row">
                <span className="company-label">Год основания</span>
                <span className="company-value">{data.navigator.founded}</span>
              </div>
              <div className="company-row">
                <span className="company-label">Страна</span>
                <span className="company-value">{data.company.country}</span>
              </div>
              <div className="company-row">
                <span className="company-label">Адрес</span>
                <span className="company-value">{data.company.address}</span>
              </div>
            </div>
          </section>
        </main>

        {/* Sidebar */}
        <aside className="bk-sidebar">
          {/* Navigator */}
          <div className="bk-card nav-card">
            <h3 className="nav-title">Навигатор</h3>
            <div className="nav-list">
              <div className="nav-item">
                <span className="nav-label">Отзывы</span>
                <span className="nav-value blue">{data.stats.reviewsCount.toLocaleString()}</span>
              </div>
              <div className="nav-item">
                <span className="nav-label">Вопросы</span>
                <span className="nav-value blue">{data.stats.questionsCount}</span>
              </div>
              <div className="nav-item">
                <span className="nav-label">Жалобы</span>
                <span className="nav-value blue">{data.stats.complaintsTotal}</span>
              </div>
              <div className="nav-item">
                <span className="nav-label">Букмекер</span>
                <span className="nav-value">БК</span>
              </div>
              <div className="nav-item">
                <span className="nav-label">Год основания</span>
                <span className="nav-value">{data.navigator.founded}</span>
              </div>
              <div className="nav-item">
                <span className="nav-label">Лицензия</span>
                <span className="nav-value">{data.navigator.license}</span>
              </div>
            </div>
            <div className="nav-links">
              <span>Ссылки подразделы</span>
            </div>
          </div>

          {/* Promo Banner */}
          <div className="promo-banner">
            <div className="promo-content">
              <div className="promo-text">ПОДПИШИСЬ НА</div>
              <div className="promo-title">КОНКУРС</div>
            </div>
            <div className="promo-coin">🪙</div>
            <div className="promo-socials">
              <a href="#" className="social-vk">VK</a>
              <a href="#" className="social-tg">TG</a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
