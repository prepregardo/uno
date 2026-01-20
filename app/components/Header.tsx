'use client';

import Link from 'next/link';
import { useState } from 'react';
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

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo */}
        <Link href="/" className="logo">
          <span className="logo-icon">РБ</span>
          <span className="logo-text">Рейтинг<br/>Букмекеров</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="nav-desktop">
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
            className="header-btn search-btn"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Поиск"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Меню"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        <div className="search-dropdown">
          <div className="search-container">
            <input
              type="text"
              placeholder="Поиск букмекеров, бонусов, статей..."
              className="search-input"
              autoFocus
            />
            <button className="search-submit">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <nav className="nav-mobile">
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
