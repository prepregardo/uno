import { getAllContent } from '@/lib/content';
import { getAllCmsContent } from '@/lib/db';
import Dashboard from './components/Dashboard';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

// ISR: обновлять каждые 60 секунд для отображения изменений из CMS
export const revalidate = 60;

export default async function HomePage() {
  // Получаем контент из файлов (всегда доступен)
  const fileContent = getAllContent();

  // Пробуем получить контент из БД (CMS), если доступна
  let dbContent = null;
  try {
    dbContent = await getAllCmsContent();
  } catch (error) {
    // БД недоступна во время сборки — используем файлы
    console.log('DB not available, using file content');
  }

  // Если в БД есть контент — используем его, иначе файлы
  const fullContent = {
    bookmaker: dbContent?.bookmaker || fileContent.bookmaker,
    margins: fileContent.margins,
    sports: dbContent?.sports || fileContent.sports,
  };

  const buildTime = format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: ru });

  return <Dashboard content={fullContent} buildTime={buildTime} />;
}
