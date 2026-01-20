import { Metadata } from 'next';
import { getBookmaker, getBookmakerSlugs } from '@/lib/data';
import YouTubeLite from '@/app/components/YouTubeLite';
import './styles.css';

// ISR: Revalidate every hour (3600 seconds)
// Pages will be regenerated in the background when requested
export const revalidate = 3600;

// Generate static params for all bookmakers at build time
export async function generateStaticParams() {
  const slugs = await getBookmakerSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await getBookmaker(params.slug);
  if (!data) return { title: 'Букмекер не найден' };
  return {
    title: data.seo?.title || `${data.name} - обзор букмекера`,
    description: data.seo?.description || data.description,
    alternates: {
      canonical: `https://ratingbet.ru/bookmaker/${params.slug}`,
    },
    openGraph: {
      title: data.seo?.title || `${data.name} - обзор букмекера`,
      description: data.seo?.description || data.description,
      type: 'article',
      url: `https://ratingbet.ru/bookmaker/${params.slug}`,
      siteName: 'Рейтинг Букмекеров',
      locale: 'ru_RU',
    },
    twitter: {
      card: 'summary_large_image',
      title: data.seo?.title || `${data.name} - обзор букмекера`,
      description: data.seo?.description || data.description,
    },
  };
}

// JSON-LD structured data for SEO
function generateStructuredData(data: any, slug: string) {
  const baseUrl = 'https://ratingbet.ru';

  // Organization Schema
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Рейтинг Букмекеров',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    sameAs: [
      'https://t.me/ratingbet',
      'https://vk.com/ratingbet',
    ],
  };

  // BreadcrumbList Schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Главная',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Букмекеры',
        item: `${baseUrl}/bookmakers`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: data.name,
        item: `${baseUrl}/bookmaker/${slug}`,
      },
    ],
  };

  // Review/AggregateRating Schema
  const reviewSchema = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'Organization',
      name: data.name,
      image: `${baseUrl}/bookmakers/${slug}.png`,
      address: {
        '@type': 'PostalAddress',
        addressCountry: data.company?.country || 'RU',
      },
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: data.navigator?.rating || data.ratings?.overall || 8,
      bestRating: 10,
      worstRating: 1,
    },
    author: {
      '@type': 'Organization',
      name: 'Рейтинг Букмекеров',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Рейтинг Букмекеров',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: data.navigator?.rating || data.ratings?.overall || 8,
      bestRating: 10,
      worstRating: 1,
      ratingCount: data.stats?.reviewsCount || 100,
      reviewCount: data.stats?.reviewsCount || 100,
    },
  };

  // FAQPage Schema
  const faqSchema = data.faq && data.faq.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: data.faq.slice(0, 10).map((item: any) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  } : null;

  // SportsActivityLocation for betting site
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: data.name,
    description: data.description,
    url: data.website,
    telephone: data.support?.phone,
    email: data.support?.email,
    foundingDate: data.navigator?.founded?.toString(),
    address: {
      '@type': 'PostalAddress',
      streetAddress: data.company?.address,
      addressCountry: data.company?.country || 'RU',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: data.navigator?.rating || 8,
      bestRating: 10,
      ratingCount: data.stats?.reviewsCount || 100,
    },
  };

  return [organizationSchema, breadcrumbSchema, reviewSchema, localBusinessSchema, faqSchema].filter(Boolean);
}

function Stars({ rating, size = 'normal', label }: { rating: number; size?: 'normal' | 'small' | 'large'; label?: string }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  const sizeClass = size === 'small' ? 'stars-sm' : size === 'large' ? 'stars-lg' : '';
  return (
    <div
      className={`stars ${sizeClass}`}
      role="img"
      aria-label={label || `Рейтинг: ${rating} из 5 звезд`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`star ${i < fullStars ? 'full' : i === fullStars && hasHalf ? 'half' : 'empty'}`}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </div>
  );
}

function RatingBar({ value, maxValue = 10, label }: { value: number; maxValue?: number; label?: string }) {
  const percent = (value / maxValue) * 100;
  return (
    <div
      className="rating-bar"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={maxValue}
      aria-label={label || `${value} из ${maxValue}`}
    >
      <div className="rating-bar-fill" style={{ width: `${percent}%` }} />
    </div>
  );
}

export default async function BookmakerPage({ params }: { params: { slug: string } }) {
  const data = await getBookmaker(params.slug);

  if (!data) {
    return (
      <div className="bk-page">
        <div className="not-found" role="alert">
          <h1>Букмекер не найден</h1>
          <p>Запрашиваемая страница не существует.</p>
        </div>
      </div>
    );
  }

  const structuredData = generateStructuredData(data, params.slug);

  return (
    <div className="bk-page">
      {/* JSON-LD Structured Data for SEO */}
      {structuredData.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <div className="bk-container">
        {/* Main Content */}
        <article className="bk-main">
          {/* Hero Card */}
          <header className="bk-card bk-hero">
            <div className="hero-top">
              <div className="hero-logo" aria-hidden="true">
                <div className="logo-img">W</div>
                <div className="logo-badge">✓</div>
              </div>
              <div className="hero-content">
                <h1 className="hero-title">{data.name} БК: {data.stats.reviewsCount.toLocaleString()} отзывов, {data.navigator.bonus} бонус, жалобы, обзор</h1>
                <div className="hero-rating">
                  <Stars rating={data.navigator.rating / 2} label={`Общий рейтинг: ${data.navigator.rating} из 10`} />
                </div>
              </div>
              <a
                href={data.website}
                target="_blank"
                rel="noopener noreferrer"
                className="hero-btn"
                aria-label={`Перейти на сайт ${data.name}`}
              >
                Перейти на сайт
              </a>
            </div>
            <div className="hero-stats" role="list" aria-label="Статистика букмекера">
              <div className="hero-stat" role="listitem">
                <span className="stat-icon" aria-hidden="true">💬</span>
                <span className="stat-val">{data.stats.reviewsCount.toLocaleString()}</span>
                <span className="visually-hidden">отзывов</span>
              </div>
              <div className="hero-stat" role="listitem">
                <span className="stat-icon" aria-hidden="true">❓</span>
                <span className="stat-val">{data.stats.questionsCount}</span>
                <span className="visually-hidden">вопросов</span>
              </div>
              <div className="hero-stat" role="listitem">
                <span className="stat-icon" aria-hidden="true">👁</span>
                <span className="stat-val">{(data.stats.viewsCount / 1000).toFixed(1)}K</span>
                <span className="visually-hidden">просмотров</span>
              </div>
              <div className="hero-stat highlight" role="listitem">
                <span className="stat-icon" aria-hidden="true">🎁</span>
                <span className="stat-val">{data.navigator.bonus}</span>
                <span className="visually-hidden">бонус</span>
              </div>
              <div className="hero-stat" role="listitem">
                <span className="stat-icon" aria-hidden="true">📊</span>
                <span className="stat-val">768</span>
                <span className="visually-hidden">ставок в лайве</span>
              </div>
              <div className="hero-stat" role="listitem">
                <span className="stat-icon" aria-hidden="true">⚠️</span>
                <span className="stat-val">{data.stats.complaintsTotal}</span>
                <span className="visually-hidden">жалоб</span>
              </div>
            </div>
          </header>

          {/* Table of Contents */}
          <nav className="bk-card bk-toc" aria-label="Содержание страницы">
            <details className="toc-details">
              <summary className="toc-summary">
                <span className="toc-icon" aria-hidden="true">📋</span>
                <span>Полное содержание</span>
                <span className="toc-arrow" aria-hidden="true">▼</span>
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
          </nav>

          {/* Reviews Section */}
          <section id="reviews" className="bk-card bk-reviews" aria-labelledby="reviews-heading">
            <div className="section-head">
              <h2 id="reviews-heading">Отзывы <span className="count">{data.stats.reviewsCount.toLocaleString()}</span></h2>
              <Stars rating={5} label="Средний рейтинг отзывов" />
              <a href="#" className="link-all" aria-label="Смотреть все отзывы">Смотреть все</a>
            </div>

            <div className="reviews-filter">
              <button
                type="button"
                className="filter-btn active"
                aria-pressed="true"
              >
                <span className="filter-icon" aria-hidden="true">👁</span>
                Показать выбранные отзывы
              </button>
            </div>

            <div className="reviews-list" role="list">
              {data.demoReviews?.slice(0, 3).map((review: any) => (
                <article key={review.id} className="review-item" role="listitem">
                  <div className="review-left">
                    <div className="review-avatar" aria-hidden="true">{review.userName.charAt(0)}</div>
                  </div>
                  <div className="review-body">
                    <div className="review-header">
                      <span className="review-name">
                        {review.userName}
                        {review.isVerified && <span className="verified" aria-label="Верифицированный пользователь">✓</span>}
                      </span>
                      <time className="review-date" dateTime={review.date}>{review.date}</time>
                    </div>
                    <div className="review-stars">
                      <Stars rating={review.rating / 2} size="small" label={`Оценка: ${review.rating} из 10`} />
                      <span className="review-score">{review.rating}/10</span>
                    </div>
                    {review.title && <h3 className="review-title">{review.title}</h3>}
                    <p className="review-text">{review.text}</p>
                    <div className="review-footer">
                      <button type="button" className="react-btn like" aria-label={`Отметить как полезный, ${review.likes} человек отметили`}>
                        <span aria-hidden="true">👍</span> Полезно <span>{review.likes}</span>
                      </button>
                      <button type="button" className="react-btn" aria-label="Ответить на отзыв">
                        <span aria-hidden="true">💬</span> Ответить
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="reviews-more">
              <span>У вас есть опыт игры в этой БК?</span>
              <a href="#" className="btn-write">Написать отзыв</a>
            </div>
          </section>

          {/* Video Review - Uses lite-youtube for better performance */}
          {data.videoReview && (
            <section id="video" className="bk-card bk-video" aria-labelledby="video-heading">
              <h2 id="video-heading">Видеообзор БК {data.name}</h2>
              <div className="video-container">
                <YouTubeLite
                  videoId={data.videoReview.youtubeId}
                  title={`Видеообзор букмекера ${data.name}`}
                />
              </div>
            </section>
          )}

          {/* Editorial Rating */}
          <section id="rating" className="bk-card bk-rating" aria-labelledby="rating-heading">
            <div className="rating-header">
              <h2 id="rating-heading">Оценка Рейтинга Букмекеров</h2>
              <Stars rating={data.ratings.overall / 2} size="large" label={`Общая оценка: ${data.ratings.overall} из 10`} />
            </div>

            <div className="editor-block">
              <div className="editor-avatar" aria-hidden="true">
                <div className="avatar-placeholder">РБ</div>
              </div>
              <div className="editor-info">
                <span className="editor-label">Редакция RatingBet</span>
                <p className="editor-text">{data.editorialReview.text}</p>
              </div>
            </div>

            <div className="ratings-grid" role="list" aria-label="Оценки по категориям">
              {data.ratings.categories.map((cat: any, idx: number) => (
                <div key={idx} className="rating-item" role="listitem">
                  <div className="rating-row">
                    <span className="rating-name">{cat.name}</span>
                    <span className="rating-value">{cat.value}</span>
                  </div>
                  <RatingBar value={cat.value} maxValue={cat.maxValue} label={`${cat.name}: ${cat.value} из ${cat.maxValue}`} />
                </div>
              ))}
            </div>
          </section>

          {/* Bonuses */}
          <section id="bonuses" className="bk-card bk-bonuses" aria-labelledby="bonuses-heading">
            <div className="section-head">
              <h2 id="bonuses-heading">Бонусы: <span className="count-inline">{data.bonuses.length}</span></h2>
              <a href="#" className="link-all" aria-label="Смотреть все бонусы">Все бонусы</a>
            </div>

            <div className="bonuses-grid" role="list">
              {data.bonuses.map((bonus: any) => (
                <article key={bonus.id} className="bonus-card" role="listitem">
                  <div className="bonus-img" aria-hidden="true">
                    <div className="bonus-logo">W</div>
                  </div>
                  <div className="bonus-info">
                    <h3 className="bonus-name">{bonus.title}</h3>
                    <p className="bonus-desc">{bonus.description}</p>
                  </div>
                  <div className="bonus-amount" aria-label={`Сумма бонуса: ${bonus.amount}`}>{bonus.amount}</div>
                </article>
              ))}
            </div>

            <p className="bonuses-note">
              Бонусная программа — один из способов подчеркнуть ценность для своих клиентов.
              Приветственные бонусы прекрасно помогают привлечь новых игроков и мотивировать их зарегистрировать первый депозит.
            </p>
          </section>

          {/* Questions */}
          <section id="questions" className="bk-card bk-questions" aria-labelledby="questions-heading">
            <div className="section-head">
              <h2 id="questions-heading">Вопросы: <span className="count-inline">{data.stats.questionsCount}</span></h2>
              <a href="#" className="link-all" aria-label="Смотреть все вопросы">Смотреть все</a>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="bk-card bk-faq" aria-labelledby="faq-heading">
            <div className="section-head">
              <h2 id="faq-heading">FAQ: <span className="count-inline">{data.faq.length}</span></h2>
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
          <section id="complaints" className="bk-card bk-complaints" aria-labelledby="complaints-heading">
            <div className="section-head">
              <h2 id="complaints-heading">Жалобы: <span className="count-green">{data.stats.complaintsResolved}/{data.stats.complaintsTotal}</span></h2>
              <a href="#" className="link-all" aria-label="Смотреть все жалобы">Все жалобы</a>
            </div>

            <div className="complaints-grid" role="list">
              {data.demoComplaints?.slice(0, 3).map((complaint: any) => (
                <article key={complaint.id} className="complaint-card" role="listitem">
                  <div
                    className={`complaint-status ${complaint.status}`}
                    aria-label={complaint.status === 'resolved' ? 'Решена' : 'На рассмотрении'}
                  >
                    {complaint.status === 'resolved' ? '✓' : '⏳'}
                  </div>
                  <div className="complaint-info">
                    <h3 className="complaint-title">{complaint.title}</h3>
                    <p className="complaint-meta">
                      ID #{complaint.id} • <time dateTime={complaint.date}>{complaint.date}</time>
                    </p>
                  </div>
                  <div className="complaint-amount">{complaint.amount}</div>
                </article>
              ))}
            </div>

            <div className="dispute-block">
              <h3>У вас спор с букмекером?</h3>
              <button type="button" className="btn-dispute">Открыть жалобу</button>
            </div>
          </section>

          {/* Mobile Version */}
          <section className="bk-card bk-mobile" aria-labelledby="mobile-heading">
            <h2 id="mobile-heading">Мобильная версия сайта</h2>
          </section>

          {/* Apps */}
          <section id="apps" className="bk-card bk-apps" aria-labelledby="apps-heading">
            <h2 id="apps-heading">Обзоры приложений</h2>

            <div className="apps-grid">
              <article className="app-card">
                <div className="app-icon ios" role="img" aria-label="iOS приложение"></div>
                <div className="app-info">
                  <h3 className="app-name">«{data.name}» для iOS</h3>
                  <div className="app-rating">
                    <Stars rating={4.5} size="small" label="Рейтинг 4.7 из 5" />
                    <span>4.7</span>
                  </div>
                </div>
              </article>
              <article className="app-card">
                <div className="app-icon android" role="img" aria-label="Android приложение"></div>
                <div className="app-info">
                  <h3 className="app-name">«{data.name}» для Android</h3>
                  <div className="app-rating">
                    <Stars rating={4.5} size="small" label="Рейтинг 4.5 из 5" />
                    <span>4.5</span>
                  </div>
                </div>
              </article>
            </div>

            <div className="app-description">
              <p>
                БК {data.name} есть и на сайте и приложение. Для вас прежде всего букмекер решил создать удобный интерфейс,
                а также пообещал быстроту ставок и работы приложения.
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
                <a
                  href="#"
                  className="store-btn appstore"
                  aria-label="Скачать приложение в App Store"
                >
                  <span className="store-icon" aria-hidden="true"></span>
                  <span className="store-text">
                    <small>Загрузите в</small>
                    App Store
                  </span>
                </a>
                <a
                  href="#"
                  className="store-btn googleplay"
                  aria-label="Скачать приложение в Google Play"
                >
                  <span className="store-icon" aria-hidden="true"></span>
                  <span className="store-text">
                    <small>Доступно в</small>
                    Google Play
                  </span>
                </a>
              </div>
            </div>
          </section>

          {/* Payment Methods */}
          <section id="payments" className="bk-card bk-payments" aria-labelledby="payments-heading">
            <h2 id="payments-heading">Способы платежей</h2>

            <div className="payments-grid" role="list" aria-label="Доступные способы оплаты">
              {data.paymentMethods.map((method: any, idx: number) => (
                <div key={idx} className="payment-card" role="listitem">
                  <span className="payment-icon" aria-hidden="true">
                    {method.icon === 'visa' ? '💳' : method.icon === 'mastercard' ? '💳' : method.icon === 'mir' ? '🏦' : '💰'}
                  </span>
                  <span className="payment-name">{method.name}</span>
                </div>
              ))}
            </div>

            <div className="table-wrapper">
              <table className="payments-table" aria-label="Условия платежных методов">
                <thead>
                  <tr>
                    <th scope="col">Способ</th>
                    <th scope="col">Депозит</th>
                    <th scope="col">Вывод</th>
                    <th scope="col">Время</th>
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
            </div>
          </section>

          {/* Support */}
          <section id="support" className="bk-card bk-support" aria-labelledby="support-heading">
            <h2 id="support-heading">Служба поддержки</h2>

            <p className="support-text">
              Поддержка клиентов {data.name} — одна из лучших на российском рынке. На сайте есть чат, e-mail, раздел помощи FAQ.
              Операторы отвечают быстро и по делу, решают вопросы оперативно.
            </p>

            <dl className="support-grid">
              <div className="support-item">
                <dt className="support-label">Онлайн чат</dt>
                <dd className="support-value green">Есть</dd>
              </div>
              <div className="support-item">
                <dt className="support-label">Email</dt>
                <dd className="support-value">{data.support.email}</dd>
              </div>
              <div className="support-item">
                <dt className="support-label">Телефон</dt>
                <dd className="support-value">{data.support.phone}</dd>
              </div>
              <div className="support-item">
                <dt className="support-label">Режим работы</dt>
                <dd className="support-value">{data.support.workingHours}</dd>
              </div>
            </dl>
          </section>

          {/* Reliability */}
          <section id="reliability" className="bk-card bk-reliability" aria-labelledby="reliability-heading">
            <h2 id="reliability-heading">Надежность</h2>

            <div className="reliability-grid" role="list">
              <div className="reliability-item" role="listitem">
                <div className="rel-icon" aria-hidden="true">🏆</div>
                <div className="rel-info">
                  <span className="rel-label">Признание {data.name}</span>
                  <span className="rel-value">ТОП букмекер</span>
                </div>
              </div>
              <div className="reliability-item" role="listitem">
                <div className="rel-percent green" aria-label={`${data.reliability.complaintsResolvedPercent} процентов`}>
                  {data.reliability.complaintsResolvedPercent}%
                </div>
                <div className="rel-info">
                  <span className="rel-label">Жалоб решено</span>
                </div>
              </div>
              <div className="reliability-item" role="listitem">
                <div className="rel-percent" aria-label={`${100 - data.reliability.complaintsResolvedPercent} процентов`}>
                  {100 - data.reliability.complaintsResolvedPercent}%
                </div>
                <div className="rel-info">
                  <span className="rel-label">Жалоб не решено</span>
                </div>
              </div>
            </div>
          </section>

          {/* Licenses */}
          <section id="licenses" className="bk-card bk-licenses" aria-labelledby="licenses-heading">
            <h2 id="licenses-heading">Лицензии</h2>

            <div className="license-info">
              <p>
                Об этом можно узнать на сайте «Букмекер.рф» в карточке лицензиата Букмекерской конторы (БК) «{data.name}».
              </p>
            </div>

            <ul className="license-list">
              {data.licenses.map((license: any, idx: number) => (
                <li key={idx} className="license-item">
                  <span className="license-icon" aria-hidden="true">📜</span>
                  <span className="license-text">{license.name} — {license.number}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Organization */}
          <section className="bk-card bk-org" aria-labelledby="org-heading">
            <h2 id="org-heading">Организация</h2>
          </section>

          {/* Rating History */}
          <section className="bk-card bk-history" aria-labelledby="history-heading">
            <h2 id="history-heading">История оценок</h2>
          </section>

          {/* Company Info */}
          <section id="company" className="bk-card bk-company" aria-labelledby="company-heading">
            <h2 id="company-heading">Информация о компании</h2>

            <dl className="company-table">
              <div className="company-row">
                <dt className="company-label">Юридическое название</dt>
                <dd className="company-value">{data.company.legalName}</dd>
              </div>
              <div className="company-row">
                <dt className="company-label">ОГРН</dt>
                <dd className="company-value">{data.company.registrationNumber}</dd>
              </div>
              <div className="company-row">
                <dt className="company-label">Год основания</dt>
                <dd className="company-value">{data.navigator.founded}</dd>
              </div>
              <div className="company-row">
                <dt className="company-label">Страна</dt>
                <dd className="company-value">{data.company.country}</dd>
              </div>
              <div className="company-row">
                <dt className="company-label">Адрес</dt>
                <dd className="company-value">{data.company.address}</dd>
              </div>
            </dl>
          </section>
        </article>

        {/* Sidebar */}
        <aside className="bk-sidebar" aria-label="Дополнительная информация">
          {/* Navigator */}
          <div className="bk-card nav-card">
            <h2 className="nav-title">Навигатор</h2>
            <dl className="nav-list">
              <div className="nav-item">
                <dt className="nav-label">Отзывы</dt>
                <dd className="nav-value blue">{data.stats.reviewsCount.toLocaleString()}</dd>
              </div>
              <div className="nav-item">
                <dt className="nav-label">Вопросы</dt>
                <dd className="nav-value blue">{data.stats.questionsCount}</dd>
              </div>
              <div className="nav-item">
                <dt className="nav-label">Жалобы</dt>
                <dd className="nav-value blue">{data.stats.complaintsTotal}</dd>
              </div>
              <div className="nav-item">
                <dt className="nav-label">Букмекер</dt>
                <dd className="nav-value">БК</dd>
              </div>
              <div className="nav-item">
                <dt className="nav-label">Год основания</dt>
                <dd className="nav-value">{data.navigator.founded}</dd>
              </div>
              <div className="nav-item">
                <dt className="nav-label">Лицензия</dt>
                <dd className="nav-value">{data.navigator.license}</dd>
              </div>
            </dl>
            <div className="nav-links">
              <span>Ссылки подразделы</span>
            </div>
          </div>

          {/* Promo Banner */}
          <div className="promo-banner" role="complementary" aria-label="Промо баннер">
            <div className="promo-content">
              <p className="promo-text">ПОДПИШИСЬ НА</p>
              <p className="promo-title">КОНКУРС</p>
            </div>
            <div className="promo-coin" aria-hidden="true">🪙</div>
            <div className="promo-socials">
              <a href="#" className="social-vk" aria-label="Подписаться ВКонтакте">VK</a>
              <a href="#" className="social-tg" aria-label="Подписаться в Telegram">TG</a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
