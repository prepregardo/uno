import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Winline Review - Автоматический обзор букмекера',
  description: 'Автоматизированный обзор букмекерской компании Winline с реальными данными',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
