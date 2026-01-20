'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import './admin.css';

interface BookmakerItem {
  slug: string;
  name: string;
  logo: string;
  rating: number;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookmakers, setBookmakers] = useState<BookmakerItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      // Load bookmakers list
      fetch('/api/bookmakers')
        .then(res => res.json())
        .then(data => {
          setBookmakers(data.bookmakers || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status]);

  if (status === 'loading' || loading) {
    return <div className="admin-loading">Загрузка...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-sidebar">
        <div className="admin-logo">
          <span className="logo-icon">РБ</span>
          <span>Админ</span>
        </div>
        <nav className="admin-nav">
          <Link href="/admin" className="nav-item active">
            📊 Дашборд
          </Link>
          <Link href="/admin" className="nav-item">
            📝 Букмекеры
          </Link>
          <Link href="/" className="nav-item">
            🌐 На сайт
          </Link>
        </nav>
        <div className="admin-user">
          <div className="user-info">
            {session.user?.image && (
              <img src={session.user.image} alt="" className="user-avatar" />
            )}
            <span>{session.user?.name}</span>
          </div>
          <button onClick={() => signOut()} className="logout-btn">
            Выйти
          </button>
        </div>
      </div>

      <div className="admin-main">
        <header className="admin-header">
          <h1>Панель управления</h1>
        </header>

        <div className="admin-content">
          {/* Quick Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-icon">📚</span>
              <div className="stat-info">
                <span className="stat-value">{bookmakers.length}</span>
                <span className="stat-label">Букмекеров</span>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">⭐</span>
              <div className="stat-info">
                <span className="stat-value">1</span>
                <span className="stat-label">Полных обзоров</span>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">💬</span>
              <div className="stat-info">
                <span className="stat-value">5470</span>
                <span className="stat-label">Отзывов</span>
              </div>
            </div>
          </div>

          {/* Bookmakers List */}
          <section className="card">
            <div className="card-header">
              <h2>Букмекеры</h2>
              <span className="badge">{bookmakers.length}</span>
            </div>
            <div className="bookmakers-list">
              {/* Winline with full review */}
              <Link href="/admin/bookmaker/winline" className="bookmaker-item featured">
                <span className="bk-logo">🏆</span>
                <div className="bk-info">
                  <span className="bk-name">Винлайн</span>
                  <span className="bk-meta">Полный обзор</span>
                </div>
                <span className="bk-badge">Редактировать →</span>
              </Link>

              {/* Other bookmakers */}
              {bookmakers.filter(b => b.slug !== 'winline').slice(0, 10).map(bk => (
                <div key={bk.slug} className="bookmaker-item">
                  <span className="bk-logo">{bk.logo}</span>
                  <div className="bk-info">
                    <span className="bk-name">{bk.name}</span>
                    <span className="bk-meta">Рейтинг: {bk.rating}</span>
                  </div>
                  <span className="bk-badge disabled">Скоро</span>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Actions */}
          <section className="card">
            <div className="card-header">
              <h2>Быстрые действия</h2>
            </div>
            <div className="actions-grid">
              <Link href="/admin/bookmaker/winline" className="action-card">
                <span className="action-icon">✏️</span>
                <span className="action-label">Редактировать Winline</span>
              </Link>
              <Link href="/bookmaker/winline" className="action-card">
                <span className="action-icon">👁</span>
                <span className="action-label">Просмотр страницы</span>
              </Link>
              <Link href="/bookmakers" className="action-card">
                <span className="action-icon">📋</span>
                <span className="action-label">Все букмекеры</span>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
