'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import './styles.css';

export default function BookmakerAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (slug) {
      fetch(`/api/admin/bookmaker/${slug}`)
        .then(res => res.json())
        .then(d => {
          setData(d);
          setLoading(false);
        })
        .catch(() => {
          setMessage('Ошибка загрузки данных');
          setLoading(false);
        });
    }
  }, [slug]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`/api/admin/bookmaker/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setMessage('Сохранено!');
      } else {
        setMessage('Ошибка сохранения');
      }
    } catch {
      setMessage('Ошибка сохранения');
    }
    setSaving(false);
  };

  const updateField = (path: string, value: any) => {
    setData((prev: any) => {
      const newData = { ...prev };
      const keys = path.split('.');
      let obj = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) obj[keys[i]] = {};
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const updateArrayItem = (arrayPath: string, index: number, field: string, value: any) => {
    setData((prev: any) => {
      const newData = { ...prev };
      const keys = arrayPath.split('.');
      let arr = newData;
      for (const key of keys) {
        arr = arr[key];
      }
      if (Array.isArray(arr) && arr[index]) {
        arr[index] = { ...arr[index], [field]: value };
      }
      return { ...newData };
    });
  };

  const addArrayItem = (arrayPath: string, newItem: any) => {
    setData((prev: any) => {
      const newData = { ...prev };
      const keys = arrayPath.split('.');
      let obj = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        obj = obj[keys[i]];
      }
      const arr = obj[keys[keys.length - 1]];
      if (Array.isArray(arr)) {
        arr.push(newItem);
      }
      return { ...newData };
    });
  };

  const removeArrayItem = (arrayPath: string, index: number) => {
    setData((prev: any) => {
      const newData = { ...prev };
      const keys = arrayPath.split('.');
      let obj = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        obj = obj[keys[i]];
      }
      const arr = obj[keys[keys.length - 1]];
      if (Array.isArray(arr)) {
        arr.splice(index, 1);
      }
      return { ...newData };
    });
  };

  if (status === 'loading' || loading) {
    return <div className="admin-loading">Загрузка...</div>;
  }

  if (!session) {
    return null;
  }

  if (!data) {
    return <div className="admin-error">Букмекер не найден</div>;
  }

  const tabs = [
    { id: 'basic', label: 'Основное' },
    { id: 'navigator', label: 'Навигатор' },
    { id: 'ratings', label: 'Оценки' },
    { id: 'bonuses', label: 'Бонусы' },
    { id: 'faq', label: 'FAQ' },
    { id: 'content', label: 'Контент' },
    { id: 'payments', label: 'Платежи' },
    { id: 'support', label: 'Поддержка' },
    { id: 'company', label: 'Компания' },
    { id: 'seo', label: 'SEO' },
  ];

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Редактирование: {data.name}</h1>
        <div className="admin-actions">
          {message && <span className={`message ${message.includes('Ошибка') ? 'error' : 'success'}`}>{message}</span>}
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>

      <div className="admin-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="admin-content">
        {/* Basic Info */}
        {activeTab === 'basic' && (
          <section className="admin-section">
            <h2>Основная информация</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Название</label>
                <input
                  type="text"
                  value={data.name || ''}
                  onChange={e => updateField('name', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Slug (URL)</label>
                <input
                  type="text"
                  value={data.slug || ''}
                  onChange={e => updateField('slug', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Логотип (emoji или URL)</label>
                <input
                  type="text"
                  value={data.logo || ''}
                  onChange={e => updateField('logo', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Сайт</label>
                <input
                  type="url"
                  value={data.website || ''}
                  onChange={e => updateField('website', e.target.value)}
                />
              </div>
            </div>
            <div className="form-group full-width">
              <label>Описание</label>
              <textarea
                value={data.description || ''}
                onChange={e => updateField('description', e.target.value)}
                rows={3}
              />
            </div>

            <h3>Статистика</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Количество отзывов</label>
                <input
                  type="number"
                  value={data.stats?.reviewsCount || 0}
                  onChange={e => updateField('stats.reviewsCount', parseInt(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>Количество вопросов</label>
                <input
                  type="number"
                  value={data.stats?.questionsCount || 0}
                  onChange={e => updateField('stats.questionsCount', parseInt(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>Количество FAQ</label>
                <input
                  type="number"
                  value={data.stats?.faqCount || 0}
                  onChange={e => updateField('stats.faqCount', parseInt(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>Жалоб всего</label>
                <input
                  type="number"
                  value={data.stats?.complaintsTotal || 0}
                  onChange={e => updateField('stats.complaintsTotal', parseInt(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>Жалоб решено</label>
                <input
                  type="number"
                  value={data.stats?.complaintsResolved || 0}
                  onChange={e => updateField('stats.complaintsResolved', parseInt(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>Просмотры</label>
                <input
                  type="number"
                  value={data.stats?.viewsCount || 0}
                  onChange={e => updateField('stats.viewsCount', parseInt(e.target.value))}
                />
              </div>
            </div>

            <h3>Плюсы и минусы</h3>
            <div className="form-grid two-col">
              <div className="form-group">
                <label>Плюсы (по одному на строку)</label>
                <textarea
                  value={(data.pros || []).join('\n')}
                  onChange={e => updateField('pros', e.target.value.split('\n').filter(Boolean))}
                  rows={6}
                />
              </div>
              <div className="form-group">
                <label>Минусы (по одному на строку)</label>
                <textarea
                  value={(data.cons || []).join('\n')}
                  onChange={e => updateField('cons', e.target.value.split('\n').filter(Boolean))}
                  rows={6}
                />
              </div>
            </div>
          </section>
        )}

        {/* Navigator */}
        {activeTab === 'navigator' && (
          <section className="admin-section">
            <h2>Навигатор (боковая панель)</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Рейтинг</label>
                <input
                  type="number"
                  step="0.1"
                  value={data.navigator?.rating || 0}
                  onChange={e => updateField('navigator.rating', parseFloat(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>Рейтинг из</label>
                <input
                  type="number"
                  value={data.navigator?.ratingOutOf || 10}
                  onChange={e => updateField('navigator.ratingOutOf', parseInt(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>Категория</label>
                <input
                  type="text"
                  value={data.navigator?.category || ''}
                  onChange={e => updateField('navigator.category', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Бонус</label>
                <input
                  type="text"
                  value={data.navigator?.bonus || ''}
                  onChange={e => updateField('navigator.bonus', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Год основания</label>
                <input
                  type="number"
                  value={data.navigator?.founded || 2000}
                  onChange={e => updateField('navigator.founded', parseInt(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>Лицензия</label>
                <input
                  type="text"
                  value={data.navigator?.license || ''}
                  onChange={e => updateField('navigator.license', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Мин. депозит</label>
                <input
                  type="text"
                  value={data.navigator?.minDeposit || ''}
                  onChange={e => updateField('navigator.minDeposit', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Онлайн поддержка</label>
                <select
                  value={data.navigator?.onlineSupport ? 'true' : 'false'}
                  onChange={e => updateField('navigator.onlineSupport', e.target.value === 'true')}
                >
                  <option value="true">Есть</option>
                  <option value="false">Нет</option>
                </select>
              </div>
            </div>
          </section>
        )}

        {/* Ratings */}
        {activeTab === 'ratings' && (
          <section className="admin-section">
            <h2>Оценки</h2>
            <div className="form-group">
              <label>Общий рейтинг</label>
              <input
                type="number"
                step="0.1"
                value={data.ratings?.overall || 0}
                onChange={e => updateField('ratings.overall', parseFloat(e.target.value))}
              />
            </div>

            <h3>Категории оценок</h3>
            {(data.ratings?.categories || []).map((cat: any, idx: number) => (
              <div key={idx} className="form-row">
                <input
                  type="text"
                  placeholder="Название"
                  value={cat.name || ''}
                  onChange={e => updateArrayItem('ratings.categories', idx, 'name', e.target.value)}
                />
                <input
                  type="number"
                  step="0.1"
                  placeholder="Значение"
                  value={cat.value || 0}
                  onChange={e => updateArrayItem('ratings.categories', idx, 'value', parseFloat(e.target.value))}
                />
                <input
                  type="number"
                  placeholder="Максимум"
                  value={cat.maxValue || 10}
                  onChange={e => updateArrayItem('ratings.categories', idx, 'maxValue', parseInt(e.target.value))}
                />
                <button className="btn-icon" onClick={() => removeArrayItem('ratings.categories', idx)}>✕</button>
              </div>
            ))}
            <button
              className="btn btn-secondary"
              onClick={() => addArrayItem('ratings.categories', { name: '', value: 0, maxValue: 10 })}
            >
              + Добавить категорию
            </button>

            <h3>Редакционный обзор</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Имя автора</label>
                <input
                  type="text"
                  value={data.editorialReview?.authorName || ''}
                  onChange={e => updateField('editorialReview.authorName', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Должность</label>
                <input
                  type="text"
                  value={data.editorialReview?.authorPosition || ''}
                  onChange={e => updateField('editorialReview.authorPosition', e.target.value)}
                />
              </div>
            </div>
            <div className="form-group full-width">
              <label>Текст обзора</label>
              <textarea
                value={data.editorialReview?.text || ''}
                onChange={e => updateField('editorialReview.text', e.target.value)}
                rows={4}
              />
            </div>
          </section>
        )}

        {/* Bonuses */}
        {activeTab === 'bonuses' && (
          <section className="admin-section">
            <h2>Бонусы</h2>
            {(data.bonuses || []).map((bonus: any, idx: number) => (
              <div key={idx} className="admin-card">
                <div className="card-header">
                  <h4>Бонус #{idx + 1}</h4>
                  <button className="btn-icon" onClick={() => removeArrayItem('bonuses', idx)}>✕</button>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Заголовок</label>
                    <input
                      type="text"
                      value={bonus.title || ''}
                      onChange={e => updateArrayItem('bonuses', idx, 'title', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Сумма</label>
                    <input
                      type="text"
                      value={bonus.amount || ''}
                      onChange={e => updateArrayItem('bonuses', idx, 'amount', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Тип</label>
                    <select
                      value={bonus.type || 'welcome'}
                      onChange={e => updateArrayItem('bonuses', idx, 'type', e.target.value)}
                    >
                      <option value="welcome">Приветственный</option>
                      <option value="freebet">Фрибет</option>
                      <option value="cashback">Кэшбэк</option>
                      <option value="promo">Промо</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Промокод</label>
                    <input
                      type="text"
                      value={bonus.promoCode || ''}
                      onChange={e => updateArrayItem('bonuses', idx, 'promoCode', e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group full-width">
                  <label>Описание</label>
                  <textarea
                    value={bonus.description || ''}
                    onChange={e => updateArrayItem('bonuses', idx, 'description', e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Условия</label>
                  <textarea
                    value={bonus.conditions || ''}
                    onChange={e => updateArrayItem('bonuses', idx, 'conditions', e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            ))}
            <button
              className="btn btn-secondary"
              onClick={() => addArrayItem('bonuses', { id: Date.now().toString(), title: '', amount: '', type: 'welcome', description: '', conditions: '' })}
            >
              + Добавить бонус
            </button>
          </section>
        )}

        {/* FAQ */}
        {activeTab === 'faq' && (
          <section className="admin-section">
            <h2>FAQ</h2>
            {(data.faq || []).map((item: any, idx: number) => (
              <div key={idx} className="admin-card">
                <div className="card-header">
                  <h4>Вопрос #{idx + 1}</h4>
                  <button className="btn-icon" onClick={() => removeArrayItem('faq', idx)}>✕</button>
                </div>
                <div className="form-group">
                  <label>Вопрос</label>
                  <input
                    type="text"
                    value={item.question || ''}
                    onChange={e => updateArrayItem('faq', idx, 'question', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Ответ</label>
                  <textarea
                    value={item.answer || ''}
                    onChange={e => updateArrayItem('faq', idx, 'answer', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            ))}
            <button
              className="btn btn-secondary"
              onClick={() => addArrayItem('faq', { question: '', answer: '' })}
            >
              + Добавить вопрос
            </button>
          </section>
        )}

        {/* Content */}
        {activeTab === 'content' && (
          <section className="admin-section">
            <h2>Контент страницы</h2>
            <div className="form-group full-width">
              <label>Введение (HTML)</label>
              <textarea
                value={data.content?.intro || ''}
                onChange={e => updateField('content.intro', e.target.value)}
                rows={6}
              />
            </div>
            <div className="form-group full-width">
              <label>Регистрация (HTML)</label>
              <textarea
                value={data.content?.registration || ''}
                onChange={e => updateField('content.registration', e.target.value)}
                rows={4}
              />
            </div>
            <div className="form-group full-width">
              <label>Депозит (HTML)</label>
              <textarea
                value={data.content?.deposit || ''}
                onChange={e => updateField('content.deposit', e.target.value)}
                rows={4}
              />
            </div>
            <div className="form-group full-width">
              <label>Вывод (HTML)</label>
              <textarea
                value={data.content?.withdrawal || ''}
                onChange={e => updateField('content.withdrawal', e.target.value)}
                rows={4}
              />
            </div>
            <div className="form-group full-width">
              <label>Ставки (HTML)</label>
              <textarea
                value={data.content?.betting || ''}
                onChange={e => updateField('content.betting', e.target.value)}
                rows={4}
              />
            </div>
            <div className="form-group full-width">
              <label>Мобильная версия (HTML)</label>
              <textarea
                value={data.content?.mobile || ''}
                onChange={e => updateField('content.mobile', e.target.value)}
                rows={4}
              />
            </div>
            <div className="form-group full-width">
              <label>Заключение (HTML)</label>
              <textarea
                value={data.content?.conclusion || ''}
                onChange={e => updateField('content.conclusion', e.target.value)}
                rows={4}
              />
            </div>

            <h3>Видеообзор</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>YouTube ID</label>
                <input
                  type="text"
                  value={data.videoReview?.youtubeId || ''}
                  onChange={e => updateField('videoReview.youtubeId', e.target.value)}
                  placeholder="dQw4w9WgXcQ"
                />
              </div>
              <div className="form-group">
                <label>Название видео</label>
                <input
                  type="text"
                  value={data.videoReview?.title || ''}
                  onChange={e => updateField('videoReview.title', e.target.value)}
                />
              </div>
            </div>
          </section>
        )}

        {/* Payments */}
        {activeTab === 'payments' && (
          <section className="admin-section">
            <h2>Способы оплаты</h2>
            {(data.paymentMethods || []).map((method: any, idx: number) => (
              <div key={idx} className="form-row">
                <input
                  type="text"
                  placeholder="Название"
                  value={method.name || ''}
                  onChange={e => updateArrayItem('paymentMethods', idx, 'name', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Мин. депозит"
                  value={method.depositMin || ''}
                  onChange={e => updateArrayItem('paymentMethods', idx, 'depositMin', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Время депозита"
                  value={method.depositTime || ''}
                  onChange={e => updateArrayItem('paymentMethods', idx, 'depositTime', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Время вывода"
                  value={method.withdrawTime || ''}
                  onChange={e => updateArrayItem('paymentMethods', idx, 'withdrawTime', e.target.value)}
                />
                <button className="btn-icon" onClick={() => removeArrayItem('paymentMethods', idx)}>✕</button>
              </div>
            ))}
            <button
              className="btn btn-secondary"
              onClick={() => addArrayItem('paymentMethods', { name: '', icon: '', type: 'card', depositMin: '', depositTime: '', withdrawTime: '' })}
            >
              + Добавить способ оплаты
            </button>

            <h3>Валюты</h3>
            <div className="form-group">
              <label>Валюты (через запятую)</label>
              <input
                type="text"
                value={(data.currencies || []).join(', ')}
                onChange={e => updateField('currencies', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
              />
            </div>
          </section>
        )}

        {/* Support */}
        {activeTab === 'support' && (
          <section className="admin-section">
            <h2>Служба поддержки</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Телефон</label>
                <input
                  type="text"
                  value={data.support?.phone || ''}
                  onChange={e => updateField('support.phone', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={data.support?.email || ''}
                  onChange={e => updateField('support.email', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Live-чат</label>
                <select
                  value={data.support?.liveChat ? 'true' : 'false'}
                  onChange={e => updateField('support.liveChat', e.target.value === 'true')}
                >
                  <option value="true">Есть</option>
                  <option value="false">Нет</option>
                </select>
              </div>
              <div className="form-group">
                <label>Время работы</label>
                <input
                  type="text"
                  value={data.support?.workingHours || ''}
                  onChange={e => updateField('support.workingHours', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Telegram</label>
                <input
                  type="text"
                  value={data.support?.telegram || ''}
                  onChange={e => updateField('support.telegram', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>WhatsApp</label>
                <input
                  type="text"
                  value={data.support?.whatsapp || ''}
                  onChange={e => updateField('support.whatsapp', e.target.value)}
                />
              </div>
            </div>

            <h3>Надёжность</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Лет на рынке</label>
                <input
                  type="number"
                  value={data.reliability?.yearsOnMarket || 0}
                  onChange={e => updateField('reliability.yearsOnMarket', parseInt(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>Количество лицензий</label>
                <input
                  type="number"
                  value={data.reliability?.licensesCount || 0}
                  onChange={e => updateField('reliability.licensesCount', parseInt(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>% решённых жалоб</label>
                <input
                  type="number"
                  value={data.reliability?.complaintsResolvedPercent || 0}
                  onChange={e => updateField('reliability.complaintsResolvedPercent', parseInt(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>Среднее время ответа</label>
                <input
                  type="text"
                  value={data.reliability?.avgResponseTime || ''}
                  onChange={e => updateField('reliability.avgResponseTime', e.target.value)}
                />
              </div>
            </div>
          </section>
        )}

        {/* Company */}
        {activeTab === 'company' && (
          <section className="admin-section">
            <h2>Информация о компании</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Юридическое название</label>
                <input
                  type="text"
                  value={data.company?.legalName || ''}
                  onChange={e => updateField('company.legalName', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>ОГРН</label>
                <input
                  type="text"
                  value={data.company?.registrationNumber || ''}
                  onChange={e => updateField('company.registrationNumber', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Страна</label>
                <input
                  type="text"
                  value={data.company?.country || ''}
                  onChange={e => updateField('company.country', e.target.value)}
                />
              </div>
            </div>
            <div className="form-group full-width">
              <label>Адрес</label>
              <input
                type="text"
                value={data.company?.address || ''}
                onChange={e => updateField('company.address', e.target.value)}
              />
            </div>

            <h3>Лицензии</h3>
            {(data.licenses || []).map((license: any, idx: number) => (
              <div key={idx} className="admin-card">
                <div className="card-header">
                  <h4>Лицензия #{idx + 1}</h4>
                  <button className="btn-icon" onClick={() => removeArrayItem('licenses', idx)}>✕</button>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Название</label>
                    <input
                      type="text"
                      value={license.name || ''}
                      onChange={e => updateArrayItem('licenses', idx, 'name', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Номер</label>
                    <input
                      type="text"
                      value={license.number || ''}
                      onChange={e => updateArrayItem('licenses', idx, 'number', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Выдана</label>
                    <input
                      type="text"
                      value={license.issuedBy || ''}
                      onChange={e => updateArrayItem('licenses', idx, 'issuedBy', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              className="btn btn-secondary"
              onClick={() => addArrayItem('licenses', { name: '', number: '', issuedBy: '' })}
            >
              + Добавить лицензию
            </button>

            <h3>Приложения</h3>
            <div className="form-grid two-col">
              <div className="form-group">
                <label>iOS доступно</label>
                <select
                  value={data.apps?.ios?.available ? 'true' : 'false'}
                  onChange={e => updateField('apps.ios.available', e.target.value === 'true')}
                >
                  <option value="true">Да</option>
                  <option value="false">Нет</option>
                </select>
              </div>
              <div className="form-group">
                <label>iOS рейтинг</label>
                <input
                  type="number"
                  step="0.1"
                  value={data.apps?.ios?.rating || 0}
                  onChange={e => updateField('apps.ios.rating', parseFloat(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>Android доступно</label>
                <select
                  value={data.apps?.android?.available ? 'true' : 'false'}
                  onChange={e => updateField('apps.android.available', e.target.value === 'true')}
                >
                  <option value="true">Да</option>
                  <option value="false">Нет</option>
                </select>
              </div>
              <div className="form-group">
                <label>Android рейтинг</label>
                <input
                  type="number"
                  step="0.1"
                  value={data.apps?.android?.rating || 0}
                  onChange={e => updateField('apps.android.rating', parseFloat(e.target.value))}
                />
              </div>
            </div>
          </section>
        )}

        {/* SEO */}
        {activeTab === 'seo' && (
          <section className="admin-section">
            <h2>SEO</h2>
            <div className="form-group full-width">
              <label>Title</label>
              <input
                type="text"
                value={data.seo?.title || ''}
                onChange={e => updateField('seo.title', e.target.value)}
              />
            </div>
            <div className="form-group full-width">
              <label>Description</label>
              <textarea
                value={data.seo?.description || ''}
                onChange={e => updateField('seo.description', e.target.value)}
                rows={3}
              />
            </div>
            <div className="form-group full-width">
              <label>Keywords (через запятую)</label>
              <input
                type="text"
                value={(data.seo?.keywords || []).join(', ')}
                onChange={e => updateField('seo.keywords', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
              />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
