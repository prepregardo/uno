import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'content', 'bookmakers.json');
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);

    return NextResponse.json({
      bookmakers: data.bookmakers || [],
      total: data.bookmakers?.length || 0
    });
  } catch (error) {
    console.error('Error loading bookmakers:', error);
    return NextResponse.json(
      { bookmakers: [], total: 0, error: 'Failed to load bookmakers' },
      { status: 500 }
    );
  }
}
