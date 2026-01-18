import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getBookmaker, getSports } from '@/lib/content';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
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
    const contentDir = path.join(process.cwd(), 'content');

    // Save bookmaker
    if (bookmaker) {
      const bookmakerPath = path.join(contentDir, 'settings', 'bookmaker.json');
      fs.writeFileSync(bookmakerPath, JSON.stringify(bookmaker, null, 2));
    }

    // Save sports
    if (sports && Array.isArray(sports)) {
      const sportsDir = path.join(contentDir, 'sports');

      // Clear existing sports files
      const existingFiles = fs.readdirSync(sportsDir).filter(f => f.endsWith('.json'));
      for (const file of existingFiles) {
        fs.unlinkSync(path.join(sportsDir, file));
      }

      // Write new sports files
      for (const sport of sports) {
        const filename = sport.name
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w-]/g, '') + '.json';
        const sportPath = path.join(sportsDir, filename);
        fs.writeFileSync(sportPath, JSON.stringify(sport, null, 2));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save content:', error);
    return NextResponse.json({ error: 'Failed to save content' }, { status: 500 });
  }
}
