'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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

interface Sport {
  name: string;
  icon: string;
  eventsCount: number;
  marketsCount: number;
  avgMargin: number;
  order: number;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookmaker, setBookmaker] = useState<Bookmaker | null>(null);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'bookmaker' | 'sports'>('bookmaker');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchContent();
    }
  }, [status]);

  const fetchContent = async () => {
    try {
      const res = await fetch('/api/admin/content');
      if (res.ok) {
        const data = await res.json();
        setBookmaker(data.bookmaker);
        setSports(data.sports);
      }
    } catch (error) {
      console.error('Failed to fetch content:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveContent = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookmaker, sports }),
      });
      if (res.ok) {
        alert('Сохранено! Изменения появятся после редеплоя.');
      } else {
        alert('Ошибка сохранения');
      }
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="admin-loading">
        <div className="spinner" />
        <p>Загрузка...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="admin-header-left">
          <h1>Админ-панель</h1>
          <a href="/" className="back-link">← На сайт</a>
        </div>
        <div className="admin-header-right">
          <span className="user-info">
            {session.user?.image && (
              <img src={session.user.image} alt="" className="user-avatar" />
            )}
            {session.user?.name}
          </span>
          <button onClick={() => signOut()} className="logout-btn">
            Выйти
          </button>
        </div>
      </header>

      <nav className="admin-tabs">
        <button
          className={`tab ${activeTab === 'bookmaker' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookmaker')}
        >
          Букмекер
        </button>
        <button
          className={`tab ${activeTab === 'sports' ? 'active' : ''}`}
          onClick={() => setActiveTab('sports')}
        >
          Виды спорта ({sports.length})
        </button>
      </nav>

      <main className="admin-content">
        {activeTab === 'bookmaker' && bookmaker && (
          <div className="form-section">
            <h2>Информация о букмекере</h2>

            <div className="form-grid">
              <div className="form-group">
                <label>Название</label>
                <input
                  type="text"
                  value={bookmaker.name}
                  onChange={(e) => setBookmaker({ ...bookmaker, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Сайт</label>
                <input
                  type="url"
                  value={bookmaker.website}
                  onChange={(e) => setBookmaker({ ...bookmaker, website: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Рейтинг (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={bookmaker.rating}
                  onChange={(e) => setBookmaker({ ...bookmaker, rating: parseFloat(e.target.value) })}
                />
              </div>

              <div className="form-group">
                <label>Год основания</label>
                <input
                  type="number"
                  value={bookmaker.founded}
                  onChange={(e) => setBookmaker({ ...bookmaker, founded: parseInt(e.target.value) })}
                />
              </div>

              <div className="form-group">
                <label>Компания</label>
                <input
                  type="text"
                  value={bookmaker.company}
                  onChange={(e) => setBookmaker({ ...bookmaker, company: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Лицензия</label>
                <input
                  type="text"
                  value={bookmaker.license}
                  onChange={(e) => setBookmaker({ ...bookmaker, license: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Мин. депозит</label>
                <input
                  type="text"
                  value={bookmaker.minDeposit}
                  onChange={(e) => setBookmaker({ ...bookmaker, minDeposit: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Мин. ставка</label>
                <input
                  type="text"
                  value={bookmaker.minBet}
                  onChange={(e) => setBookmaker({ ...bookmaker, minBet: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group full-width">
              <label>Описание</label>
              <textarea
                value={bookmaker.description}
                onChange={(e) => setBookmaker({ ...bookmaker, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Преимущества</label>
                {bookmaker.pros.map((pro, i) => (
                  <div key={i} className="list-item">
                    <input
                      type="text"
                      value={pro}
                      onChange={(e) => {
                        const newPros = [...bookmaker.pros];
                        newPros[i] = e.target.value;
                        setBookmaker({ ...bookmaker, pros: newPros });
                      }}
                    />
                    <button
                      className="remove-btn"
                      onClick={() => {
                        const newPros = bookmaker.pros.filter((_, idx) => idx !== i);
                        setBookmaker({ ...bookmaker, pros: newPros });
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  className="add-btn"
                  onClick={() => setBookmaker({ ...bookmaker, pros: [...bookmaker.pros, ''] })}
                >
                  + Добавить
                </button>
              </div>

              <div className="form-group">
                <label>Недостатки</label>
                {bookmaker.cons.map((con, i) => (
                  <div key={i} className="list-item">
                    <input
                      type="text"
                      value={con}
                      onChange={(e) => {
                        const newCons = [...bookmaker.cons];
                        newCons[i] = e.target.value;
                        setBookmaker({ ...bookmaker, cons: newCons });
                      }}
                    />
                    <button
                      className="remove-btn"
                      onClick={() => {
                        const newCons = bookmaker.cons.filter((_, idx) => idx !== i);
                        setBookmaker({ ...bookmaker, cons: newCons });
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  className="add-btn"
                  onClick={() => setBookmaker({ ...bookmaker, cons: [...bookmaker.cons, ''] })}
                >
                  + Добавить
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sports' && (
          <div className="form-section">
            <h2>Виды спорта</h2>

            <div className="sports-list">
              {sports.map((sport, index) => (
                <div key={index} className="sport-edit-card">
                  <div className="sport-edit-header">
                    <span className="sport-edit-icon">{sport.icon}</span>
                    <input
                      type="text"
                      value={sport.name}
                      onChange={(e) => {
                        const newSports = [...sports];
                        newSports[index].name = e.target.value;
                        setSports(newSports);
                      }}
                      className="sport-name-input"
                    />
                  </div>

                  <div className="sport-edit-fields">
                    <div className="mini-field">
                      <label>Иконка</label>
                      <input
                        type="text"
                        value={sport.icon}
                        onChange={(e) => {
                          const newSports = [...sports];
                          newSports[index].icon = e.target.value;
                          setSports(newSports);
                        }}
                      />
                    </div>
                    <div className="mini-field">
                      <label>События</label>
                      <input
                        type="number"
                        value={sport.eventsCount}
                        onChange={(e) => {
                          const newSports = [...sports];
                          newSports[index].eventsCount = parseInt(e.target.value);
                          setSports(newSports);
                        }}
                      />
                    </div>
                    <div className="mini-field">
                      <label>Рынки</label>
                      <input
                        type="number"
                        value={sport.marketsCount}
                        onChange={(e) => {
                          const newSports = [...sports];
                          newSports[index].marketsCount = parseInt(e.target.value);
                          setSports(newSports);
                        }}
                      />
                    </div>
                    <div className="mini-field">
                      <label>Маржа %</label>
                      <input
                        type="number"
                        step="0.1"
                        value={sport.avgMargin}
                        onChange={(e) => {
                          const newSports = [...sports];
                          newSports[index].avgMargin = parseFloat(e.target.value);
                          setSports(newSports);
                        }}
                      />
                    </div>
                    <div className="mini-field">
                      <label>Порядок</label>
                      <input
                        type="number"
                        value={sport.order}
                        onChange={(e) => {
                          const newSports = [...sports];
                          newSports[index].order = parseInt(e.target.value);
                          setSports(newSports);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="admin-footer">
        <button
          className="save-btn"
          onClick={saveContent}
          disabled={saving}
        >
          {saving ? 'Сохранение...' : 'Сохранить изменения'}
        </button>
      </footer>

      <style jsx>{`
        .admin-loading {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          color: white;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-top-color: #22d3ee;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .admin-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 32px;
          background: rgba(0, 0, 0, 0.3);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .admin-header-left {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .admin-header h1 {
          font-size: 24px;
          font-weight: 700;
          color: white;
          margin: 0;
        }

        .back-link {
          color: rgba(255, 255, 255, 0.5);
          text-decoration: none;
          font-size: 14px;
        }

        .back-link:hover {
          color: white;
        }

        .admin-header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 10px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 14px;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
        }

        .logout-btn {
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s ease;
        }

        .logout-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .admin-tabs {
          display: flex;
          gap: 8px;
          padding: 16px 32px;
          background: rgba(0, 0, 0, 0.2);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .tab {
          padding: 12px 24px;
          background: transparent;
          border: 1px solid transparent;
          color: rgba(255, 255, 255, 0.6);
          border-radius: 10px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .tab:hover {
          color: white;
          background: rgba(255, 255, 255, 0.05);
        }

        .tab.active {
          background: rgba(59, 130, 246, 0.2);
          border-color: rgba(59, 130, 246, 0.3);
          color: #60a5fa;
        }

        .admin-content {
          flex: 1;
          padding: 32px;
          overflow-y: auto;
        }

        .form-section h2 {
          font-size: 20px;
          font-weight: 600;
          color: white;
          margin-bottom: 24px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-group label {
          font-size: 13px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .form-group input,
        .form-group textarea {
          padding: 12px 16px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: white;
          font-size: 15px;
          transition: all 0.3s ease;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: rgba(59, 130, 246, 0.5);
          background: rgba(0, 0, 0, 0.4);
        }

        .form-group textarea {
          resize: vertical;
          min-height: 80px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          margin-top: 24px;
        }

        .list-item {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }

        .list-item input {
          flex: 1;
        }

        .remove-btn {
          width: 40px;
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #f87171;
          border-radius: 8px;
          cursor: pointer;
          font-size: 20px;
          transition: all 0.3s ease;
        }

        .remove-btn:hover {
          background: rgba(239, 68, 68, 0.3);
        }

        .add-btn {
          padding: 10px 16px;
          background: rgba(34, 197, 94, 0.15);
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: #4ade80;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          margin-top: 8px;
          transition: all 0.3s ease;
        }

        .add-btn:hover {
          background: rgba(34, 197, 94, 0.25);
        }

        .sports-list {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .sport-edit-card {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 20px;
        }

        .sport-edit-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .sport-edit-icon {
          font-size: 28px;
        }

        .sport-name-input {
          flex: 1;
          font-size: 18px;
          font-weight: 600;
          background: transparent;
          border: none;
          color: white;
          padding: 0;
        }

        .sport-name-input:focus {
          outline: none;
        }

        .sport-edit-fields {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
        }

        .mini-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .mini-field label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
        }

        .mini-field input {
          padding: 8px 10px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: white;
          font-size: 14px;
        }

        .mini-field input:focus {
          outline: none;
          border-color: rgba(59, 130, 246, 0.5);
        }

        .admin-footer {
          padding: 20px 32px;
          background: rgba(0, 0, 0, 0.3);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: flex-end;
        }

        .save-btn {
          padding: 14px 32px;
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          border: none;
          color: white;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 10px 40px rgba(34, 197, 94, 0.3);
        }

        .save-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 15px 50px rgba(34, 197, 94, 0.4);
        }

        .save-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 1024px) {
          .form-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .sports-list {
            grid-template-columns: 1fr;
          }

          .sport-edit-fields {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 768px) {
          .admin-header {
            flex-direction: column;
            gap: 16px;
            padding: 16px;
          }

          .admin-content {
            padding: 16px;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .sport-edit-fields {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
