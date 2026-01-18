import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getContent, setContent, getAllCmsContent } from '@/lib/db';
import { getBookmaker, getSports } from '@/lib/content';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Сначала пробуем получить из БД
    const dbContent = await getAllCmsContent();

    if (dbContent && dbContent.bookmaker) {
      return NextResponse.json(dbContent);
    }

    // Если в БД пусто — читаем из файлов (fallback)
    const bookmaker = getBookmaker();
    const sports = getSports();

    return NextResponse.json({ bookmaker, sports });
  } catch (error) {
    console.error('Failed to read content:', error);
    return NextResponse.json({ error: 'Failed to read content' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { bookmaker, sports } = await request.json();

    // Сохраняем в базу данных
    if (bookmaker) {
      const success = await setContent('bookmaker', bookmaker);
      if (!success) {
        throw new Error('Failed to save bookmaker');
      }
    }

    if (sports && Array.isArray(sports)) {
      const success = await setContent('sports', sports);
      if (!success) {
        throw new Error('Failed to save sports');
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save content:', error);
    return NextResponse.json({ error: 'Failed to save content' }, { status: 500 });
  }
}
