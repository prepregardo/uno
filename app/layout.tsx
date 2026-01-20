import './globals.css';
import type { Metadata, Viewport } from 'next';
import Providers from './providers';
import Header from './components/Header';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#00c853',
};

export const metadata: Metadata = {
  title: 'РБ - Рейтинг Букмекеров | Честные обзоры и отзывы',
  description: 'Крупнейший рейтинг букмекерских контор. Честные обзоры, отзывы игроков, бонусы и промокоды.',
  keywords: 'букмекер, рейтинг, отзывы, бонусы, ставки на спорт',
  authors: [{ name: 'РБ - Рейтинг Букмекеров' }],
  robots: 'index, follow',
  openGraph: {
    title: 'РБ - Рейтинг Букмекеров',
    description: 'Крупнейший рейтинг букмекерских контор. Честные обзоры, отзывы игроков, бонусы и промокоды.',
    type: 'website',
    locale: 'ru_RU',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'РБ - Рейтинг Букмекеров',
    description: 'Крупнейший рейтинг букмекерских контор.',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        {/* Font preconnects */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* YouTube and related services preconnects */}
        <link rel="preconnect" href="https://www.youtube.com" />
        <link rel="preconnect" href="https://www.youtube-nocookie.com" />
        <link rel="preconnect" href="https://static.doubleclick.net" />
        <link rel="preconnect" href="https://i.ytimg.com" />
        <link rel="preconnect" href="https://www.google.com" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body>
        {/* Skip to main content link for accessibility */}
        <a href="#main-content" className="skip-link">
          Перейти к основному содержимому
        </a>
        <Providers>
          <Header />
          <main id="main-content" role="main">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
