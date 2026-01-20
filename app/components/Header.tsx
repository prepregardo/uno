'use client';

import Link from 'next/link';
import { useState, useId } from 'react';
import './Header.css';

const navItems = [
  { href: '/bookmakers', label: 'Букмекеры' },
  { href: '/bonuses', label: 'Бонусы' },
  { href: '/matches', label: 'Матчи' },
  { href: '/predictions', label: 'Прогнозы' },
  { href: '/news', label: 'Новости' },
  { href: '/moonbet', label: 'Moonbet' },
  { href: '/sport', label: 'РБ Спорт' },
  { href: '/bonushunting', label: 'Бонусхантинг' },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchId = useId();
  const mobileNavId = useId();

  return (
    <header className="header" role="banner">
      <div className="header-container">
        {/* Logo */}
        <Link href="/" className="logo" aria-label="РБ - Рейтинг Букмекеров - Главная страница">
          <span className="logo-icon" aria-hidden="true">РБ</span>
          <span className="logo-text" aria-hidden="true">Рейтинг<br/>Букмекеров</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="nav-desktop" aria-label="Основная навигация">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right Section */}
        <div className="header-right">
          {/* Search */}
          <button
            type="button"
            className="header-btn search-btn"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label={searchOpen ? 'Закрыть поиск' : 'Открыть поиск'}
            aria-expanded={searchOpen}
            aria-controls={searchId}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </button>

          {/* Login Button */}
          <Link href="/admin/login" className="login-btn">
            Войти
          </Link>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={mobileMenuOpen}
            aria-controls={mobileNavId}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              {mobileMenuOpen ? (
                <path d="M18 6L6 18M6 6l12 12"/>
              ) : (
                <>
                  <path d="M3 12h18"/>
                  <path d="M3 6h18"/>
                  <path d="M3 18h18"/>
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Search Dropdown */}
      {searchOpen && (
        <div id={searchId} className="search-dropdown" role="search">
          <div className="search-container">
            <label htmlFor="search-input" className="visually-hidden">Поиск по сайту</label>
            <input
              id="search-input"
              type="search"
              placeholder="Поиск букмекеров, бонусов, статей..."
              className="search-input"
              autoFocus
              autoComplete="off"
            />
            <button type="submit" className="search-submit" aria-label="Найти">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <nav id={mobileNavId} className="nav-mobile" aria-label="Мобильная навигация">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="nav-mobile-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
