import { getAllContent } from '@/lib/content';
import Dashboard from './components/Dashboard';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

// Статическая генерация — максимальная скорость
export const dynamic = 'force-static';
export const revalidate = 3600; // ISR: обновлять каждый час

export default function HomePage() {
  const content = getAllContent();
  const buildTime = format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: ru });

  return <Dashboard content={content} buildTime={buildTime} />;
}
