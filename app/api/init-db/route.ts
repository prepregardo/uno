import { NextResponse } from 'next/server';
import { initDatabase } from '@/lib/db';

export async function POST() {
  try {
    await initDatabase();
    return NextResponse.json({ success: true, message: 'Database initialized' });
  } catch (error) {
    console.error('Init DB error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
