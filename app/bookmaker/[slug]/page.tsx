import { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import './styles.css';

// Загрузка данных букмекера
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

// Компонент звёзд
function Stars({ rating, max = 5 }: { rating: number; max?: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  return (
    <div className="stars">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={`star ${i < fullStars ? 'full' : i === fullStars && hasHalf ? 'half' : 'empty'}`}>
          ★
        </span>
      ))}
    </div>
  );
}

// Компонент прогресс-бара рейтинга
function RatingBar({ value, maxValue }: { value: number; maxValue: number }) {
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
      <div className="page-container">
        <div className="not-found">
          <h1>Букмекер не найден</h1>
          <p>Запрашиваемая страница не существует.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="content-wrapper">
        {/* Основной контент */}
        <div className="main-content">
          {/* Hero Section */}
          <section className="hero-section card">
            <div className="hero-header">
              <div className="hero-logo">{data.logo}</div>
              <div className="hero-info">
                <h1 className="hero-title">{data.seo?.title || `${data.name} БК: обзор`}</h1>
                <div className="hero-meta">
                  <span className="hero-rating">
                    <Stars rating={data.navigator.rating / 2} />
                    <strong>{data.navigator.rating}</strong>/{data.navigator.ratingOutOf}
                  </span>
                </div>
              </div>
              <a href={data.website} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg">
                Перейти на сайт
              </a>
            </div>

            {/* Stats Bar */}
            <div className="stats-bar">
              <div className="stat-item">
                <span className="stat-icon">💬</span>
                <span className="stat-value">{data.stats.reviewsCount.toLocaleString()}</span>
                <span className="stat-label">отзывов</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">❓</span>
                <span className="stat-value">{data.stats.questionsCount}</span>
                <span className="stat-label">вопросов</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">👁</span>
                <span className="stat-value">{(data.stats.viewsCount / 1000).toFixed(1)}K</span>
                <span className="stat-label">просмотров</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">⚠️</span>
                <span className="stat-value">{data.stats.complaintsResolved}/{data.stats.complaintsTotal}</span>
                <span className="stat-label">жалоб решено</span>
              </div>
            </div>
          </section>

          {/* Table of Contents */}
          <section className="toc-section card">
            <h2 className="section-title">Полное содержание</h2>
            <div className="toc-grid">
              <a href="#reviews" className="toc-link">💬 Отзывы</a>
              <a href="#video" className="toc-link">🎬 Видеообзор</a>
              <a href="#rating" className="toc-link">⭐ Оценка редакции</a>
              <a href="#bonuses" className="toc-link">🎁 Бонусы</a>
              <a href="#faq" className="toc-link">❓ FAQ</a>
              <a href="#complaints" className="toc-link">⚠️ Жалобы</a>
              <a href="#apps" className="toc-link">📱 Приложения</a>
              <a href="#payments" className="toc-link">💳 Способы оплаты</a>
              <a href="#support" className="toc-link">🎧 Поддержка</a>
              <a href="#company" className="toc-link">🏢 О компании</a>
            </div>
          </section>

          {/* Reviews Section */}
          <section id="reviews" className="reviews-section card">
            <div className="section-header">
              <h2 className="section-title">Отзывы <span className="count">{data.stats.reviewsCount.toLocaleString()}</span></h2>
              <a href="#" className="section-link">Все отзывы →</a>
            </div>

            <div className="reviews-summary">
              <div className="reviews-rating-big">
                <span className="rating-number">10</span>
                <span className="rating-max">/10</span>
              </div>
              <div className="reviews-stars-big">
                <Stars rating={5} />
                <span className="reviews-count">На основе {data.stats.reviewsCount.toLocaleString()} отзывов</span>
              </div>
            </div>

            <div className="reviews-list">
              {data.demoReviews?.map((review: any) => (
                <div key={review.id} className="review-item">
                  <div className="review-header">
                    <div className="review-avatar">
                      {review.userName.charAt(0)}
                    </div>
                    <div className="review-meta">
                      <span className="review-name">
                        {review.userName}
                        {review.isVerified && <span className="verified-badge">✓</span>}
                      </span>
                      <span className="review-date">{review.date}</span>
                    </div>
                    <div className="review-rating">
                      <Stars rating={review.rating / 2} />
                      <span>{review.rating}/10</span>
                    </div>
                  </div>
                  {review.title && <h4 className="review-title">{review.title}</h4>}
                  <p className="review-text">{review.text}</p>
                  <div className="review-actions">
                    <button className="review-action">👍 {review.likes}</button>
                    <button className="review-action">💬 {review.replies}</button>
                  </div>
                </div>
              ))}
            </div>

            <button className="btn btn-secondary btn-block">Показать все отзывы</button>
          </section>

          {/* Video Review */}
          {data.videoReview && (
            <section id="video" className="video-section card">
              <h2 className="section-title">Видеообзор БК {data.name}</h2>
              <div className="video-wrapper">
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
          <section id="rating" className="rating-section card">
            <h2 className="section-title">Оценка Рейтинга Букмекеров</h2>
            <Stars rating={data.ratings.overall / 2} />

            <div className="editorial-review">
              <div className="editor-info">
                <div className="editor-avatar">👤</div>
                <div className="editor-meta">
                  <span className="editor-name">{data.editorialReview.authorName}</span>
                  <span className="editor-position">{data.editorialReview.authorPosition}</span>
                </div>
              </div>
              <p className="editorial-text">{data.editorialReview.text}</p>
            </div>

            <div className="ratings-grid">
              {data.ratings.categories.map((cat: any, idx: number) => (
                <div key={idx} className="rating-category">
                  <div className="rating-category-header">
                    <span className="rating-category-name">{cat.name}</span>
                    <span className="rating-category-value">{cat.value}/{cat.maxValue}</span>
                  </div>
                  <RatingBar value={cat.value} maxValue={cat.maxValue} />
                </div>
              ))}
            </div>
          </section>

          {/* Bonuses */}
          <section id="bonuses" className="bonuses-section card">
            <div className="section-header">
              <h2 className="section-title">Бонусы <span className="count">{data.bonuses.length}</span></h2>
            </div>

            <div className="bonuses-grid">
              {data.bonuses.map((bonus: any) => (
                <div key={bonus.id} className="bonus-card">
                  <div className="bonus-badge">{bonus.type === 'welcome' ? '🎁' : bonus.type === 'freebet' ? '🎫' : '💰'}</div>
                  <div className="bonus-content">
                    <h3 className="bonus-title">{bonus.title}</h3>
                    <p className="bonus-amount">{bonus.amount}</p>
                    <p className="bonus-description">{bonus.description}</p>
                    <p className="bonus-conditions">{bonus.conditions}</p>
                    {bonus.promoCode && (
                      <div className="promo-code">
                        Промокод: <code>{bonus.promoCode}</code>
                      </div>
                    )}
                  </div>
                  <a href={data.website} className="btn btn-primary btn-sm">Получить</a>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="faq-section card">
            <div className="section-header">
              <h2 className="section-title">FAQ <span className="count">{data.faq.length}</span></h2>
            </div>

            <div className="faq-list">
              {data.faq.map((item: any, idx: number) => (
                <details key={idx} className="faq-item">
                  <summary className="faq-question">{item.question}</summary>
                  <p className="faq-answer">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>

          {/* Complaints */}
          <section id="complaints" className="complaints-section card">
            <div className="section-header">
              <h2 className="section-title">
                Жалобы <span className="count tag-success">{data.stats.complaintsResolved}/{data.stats.complaintsTotal}</span>
              </h2>
              <a href="#" className="section-link">Все жалобы →</a>
            </div>

            <div className="complaints-stats">
              <div className="complaint-stat">
                <span className="complaint-stat-value text-success">{data.stats.complaintsResolved}</span>
                <span className="complaint-stat-label">Решено</span>
              </div>
              <div className="complaint-stat">
                <span className="complaint-stat-value text-warning">{data.stats.complaintsTotal - data.stats.complaintsResolved}</span>
                <span className="complaint-stat-label">На рассмотрении</span>
              </div>
              <div className="complaint-stat">
                <span className="complaint-stat-value">{data.reliability.complaintsResolvedPercent}%</span>
                <span className="complaint-stat-label">Решаемость</span>
              </div>
            </div>

            <div className="complaints-list">
              {data.demoComplaints?.slice(0, 3).map((complaint: any) => (
                <div key={complaint.id} className="complaint-item">
                  <div className={`complaint-status ${complaint.status}`}>
                    {complaint.status === 'resolved' ? '✓' : complaint.status === 'pending' ? '⏳' : '✕'}
                  </div>
                  <div className="complaint-content">
                    <span className="complaint-title">{complaint.title}</span>
                    <span className="complaint-meta">{complaint.userName} • {complaint.date}</span>
                  </div>
                  {complaint.amount && <span className="complaint-amount">{complaint.amount}</span>}
                </div>
              ))}
            </div>

            <div className="dispute-cta">
              <p>У вас спор с букмекером?</p>
              <button className="btn btn-outline">Подать жалобу</button>
            </div>
          </section>

          {/* Apps */}
          <section id="apps" className="apps-section card">
            <h2 className="section-title">Обзоры приложений</h2>

            <div className="apps-grid">
              <div className="app-card">
                <div className="app-icon">📱</div>
                <div className="app-info">
                  <h3>«{data.name}» для iOS</h3>
                  {data.apps.ios.available ? (
                    <>
                      <div className="app-rating">
                        <Stars rating={data.apps.ios.rating || 4.5} />
                        <span>{data.apps.ios.rating}</span>
                      </div>
                      <span className="app-version">Версия {data.apps.ios.version}</span>
                    </>
                  ) : (
                    <span className="app-unavailable">Недоступно</span>
                  )}
                </div>
                {data.apps.ios.available && (
                  <a href={data.apps.ios.downloadUrl} className="btn btn-secondary btn-sm">Скачать</a>
                )}
              </div>

              <div className="app-card">
                <div className="app-icon">🤖</div>
                <div className="app-info">
                  <h3>«{data.name}» для Android</h3>
                  {data.apps.android.available ? (
                    <>
                      <div className="app-rating">
                        <Stars rating={data.apps.android.rating || 4.5} />
                        <span>{data.apps.android.rating}</span>
                      </div>
                      <span className="app-version">Версия {data.apps.android.version}</span>
                    </>
                  ) : (
                    <span className="app-unavailable">Недоступно</span>
                  )}
                </div>
                {data.apps.android.available && (
                  <a href={data.apps.android.downloadUrl} className="btn btn-secondary btn-sm">Скачать</a>
                )}
              </div>
            </div>
          </section>

          {/* Content Sections */}
          <section className="content-section card">
            <div className="prose" dangerouslySetInnerHTML={{ __html: data.content.intro }} />

            {data.content.registration && (
              <>
                <h2>Регистрация</h2>
                <div className="prose" dangerouslySetInnerHTML={{ __html: data.content.registration }} />
              </>
            )}

            {data.content.deposit && (
              <>
                <h2>Пополнение счёта</h2>
                <div className="prose" dangerouslySetInnerHTML={{ __html: data.content.deposit }} />
              </>
            )}

            {data.content.withdrawal && (
              <>
                <h2>Вывод средств</h2>
                <div className="prose" dangerouslySetInnerHTML={{ __html: data.content.withdrawal }} />
              </>
            )}

            {data.content.betting && (
              <>
                <h2>Ставки</h2>
                <div className="prose" dangerouslySetInnerHTML={{ __html: data.content.betting }} />
              </>
            )}

            {data.content.mobile && (
              <>
                <h2>Мобильная версия</h2>
                <div className="prose" dangerouslySetInnerHTML={{ __html: data.content.mobile }} />
              </>
            )}

            {data.content.conclusion && (
              <>
                <h2>Заключение</h2>
                <div className="prose" dangerouslySetInnerHTML={{ __html: data.content.conclusion }} />
              </>
            )}
          </section>

          {/* Pros & Cons */}
          <section className="pros-cons-section card">
            <div className="pros-cons-grid">
              <div className="pros-list">
                <h3 className="pros-title">✅ Преимущества</h3>
                <ul>
                  {data.pros.map((pro: string, idx: number) => (
                    <li key={idx}>{pro}</li>
                  ))}
                </ul>
              </div>
              <div className="cons-list">
                <h3 className="cons-title">❌ Недостатки</h3>
                <ul>
                  {data.cons.map((con: string, idx: number) => (
                    <li key={idx}>{con}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Payment Methods */}
          <section id="payments" className="payments-section card">
            <h2 className="section-title">Способы оплаты</h2>

            <div className="payments-grid">
              {data.paymentMethods.map((method: any, idx: number) => (
                <div key={idx} className="payment-item">
                  <span className="payment-icon">{
                    method.icon === 'visa' ? '💳' :
                    method.icon === 'mastercard' ? '💳' :
                    method.icon === 'mir' ? '🏦' :
                    method.icon === 'qiwi' ? '🥝' :
                    method.icon === 'yoomoney' ? '💰' :
                    method.icon === 'sbp' ? '⚡' : '📱'
                  }</span>
                  <span className="payment-name">{method.name}</span>
                </div>
              ))}
            </div>

            <table className="payments-table">
              <thead>
                <tr>
                  <th>Способ</th>
                  <th>Мин. депозит</th>
                  <th>Время депозита</th>
                  <th>Время вывода</th>
                </tr>
              </thead>
              <tbody>
                {data.paymentMethods.map((method: any, idx: number) => (
                  <tr key={idx}>
                    <td>{method.name}</td>
                    <td>{method.depositMin || '—'}</td>
                    <td>{method.depositTime || '—'}</td>
                    <td>{method.withdrawTime || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Support */}
          <section id="support" className="support-section card">
            <h2 className="section-title">Служба поддержки</h2>

            <div className="support-grid">
              {data.support.phone && (
                <div className="support-item">
                  <span className="support-icon">📞</span>
                  <div className="support-info">
                    <span className="support-label">Телефон</span>
                    <a href={`tel:${data.support.phone}`} className="support-value">{data.support.phone}</a>
                  </div>
                </div>
              )}
              {data.support.email && (
                <div className="support-item">
                  <span className="support-icon">✉️</span>
                  <div className="support-info">
                    <span className="support-label">Email</span>
                    <a href={`mailto:${data.support.email}`} className="support-value">{data.support.email}</a>
                  </div>
                </div>
              )}
              {data.support.liveChat && (
                <div className="support-item">
                  <span className="support-icon">💬</span>
                  <div className="support-info">
                    <span className="support-label">Онлайн-чат</span>
                    <span className="support-value tag-success">Доступен</span>
                  </div>
                </div>
              )}
              {data.support.telegram && (
                <div className="support-item">
                  <span className="support-icon">📱</span>
                  <div className="support-info">
                    <span className="support-label">Telegram</span>
                    <span className="support-value">{data.support.telegram}</span>
                  </div>
                </div>
              )}
              {data.support.workingHours && (
                <div className="support-item">
                  <span className="support-icon">🕐</span>
                  <div className="support-info">
                    <span className="support-label">Время работы</span>
                    <span className="support-value">{data.support.workingHours}</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Reliability */}
          <section className="reliability-section card">
            <h2 className="section-title">Надёжность</h2>

            <div className="reliability-grid">
              <div className="reliability-item">
                <span className="reliability-value">{data.reliability.yearsOnMarket}</span>
                <span className="reliability-label">лет на рынке</span>
              </div>
              <div className="reliability-item">
                <span className="reliability-value">{data.reliability.licensesCount}</span>
                <span className="reliability-label">лицензий</span>
              </div>
              <div className="reliability-item">
                <span className="reliability-value">{data.reliability.complaintsResolvedPercent}%</span>
                <span className="reliability-label">жалоб решено</span>
              </div>
              <div className="reliability-item">
                <span className="reliability-value">{data.reliability.avgResponseTime}</span>
                <span className="reliability-label">среднее время ответа</span>
              </div>
            </div>
          </section>

          {/* Licenses */}
          <section className="licenses-section card">
            <h2 className="section-title">Лицензии</h2>

            {data.licenses.map((license: any, idx: number) => (
              <div key={idx} className="license-item">
                <div className="license-icon">📜</div>
                <div className="license-info">
                  <span className="license-name">{license.name}</span>
                  {license.number && <span className="license-number">{license.number}</span>}
                  <span className="license-issuer">{license.issuedBy}</span>
                </div>
              </div>
            ))}
          </section>

          {/* Company Info */}
          <section id="company" className="company-section card">
            <h2 className="section-title">Информация о компании</h2>

            <div className="company-info">
              <div className="info-row">
                <span className="info-label">Юридическое название</span>
                <span className="info-value">{data.company.legalName}</span>
              </div>
              {data.company.registrationNumber && (
                <div className="info-row">
                  <span className="info-label">ОГРН</span>
                  <span className="info-value">{data.company.registrationNumber}</span>
                </div>
              )}
              {data.company.address && (
                <div className="info-row">
                  <span className="info-label">Адрес</span>
                  <span className="info-value">{data.company.address}</span>
                </div>
              )}
              <div className="info-row">
                <span className="info-label">Страна</span>
                <span className="info-value">{data.company.country}</span>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="sidebar">
          {/* Navigator Card */}
          <div className="navigator-card card">
            <h3 className="navigator-title">Навигатор</h3>

            <div className="navigator-list">
              <div className="navigator-item">
                <span className="navigator-label">Отзывы</span>
                <span className="navigator-value">{data.stats.reviewsCount.toLocaleString()}</span>
              </div>
              <div className="navigator-item">
                <span className="navigator-label">Рейтинг</span>
                <span className="navigator-value highlight">{data.navigator.rating}/{data.navigator.ratingOutOf}</span>
              </div>
              <div className="navigator-item">
                <span className="navigator-label">Категория</span>
                <span className="navigator-value">{data.navigator.category}</span>
              </div>
              <div className="navigator-item">
                <span className="navigator-label">Бонус</span>
                <span className="navigator-value highlight">{data.navigator.bonus}</span>
              </div>
              <div className="navigator-item">
                <span className="navigator-label">Год основания</span>
                <span className="navigator-value">{data.navigator.founded}</span>
              </div>
              <div className="navigator-item">
                <span className="navigator-label">Лицензия</span>
                <span className="navigator-value">{data.navigator.license}</span>
              </div>
              <div className="navigator-item">
                <span className="navigator-label">Мин. депозит</span>
                <span className="navigator-value">{data.navigator.minDeposit}</span>
              </div>
              <div className="navigator-item">
                <span className="navigator-label">Он-лайн поддержка</span>
                <span className={`navigator-value ${data.navigator.onlineSupport ? 'text-success' : ''}`}>
                  {data.navigator.onlineSupport ? 'Есть' : 'Нет'}
                </span>
              </div>
            </div>

            <a href={data.website} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-block">
              Перейти на сайт
            </a>
          </div>

          {/* Promo Banner */}
          <div className="promo-banner card">
            <div className="promo-icon">🎁</div>
            <h4>Подпишись на конкурсы</h4>
            <p>Получай бонусы и фрибеты от букмекеров</p>
            <div className="social-links">
              <a href="#" className="social-link">TG</a>
              <a href="#" className="social-link">VK</a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
