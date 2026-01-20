import './globals.css';
import type { Metadata } from 'next';
import Providers from './providers';
import Header from './components/Header';

export const metadata: Metadata = {
  title: 'РБ - Рейтинг Букмекеров | Честные обзоры и отзывы',
  description: 'Крупнейший рейтинг букмекерских контор. Честные обзоры, отзывы игроков, бонусы и промокоды.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        <Providers>
          <Header />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
