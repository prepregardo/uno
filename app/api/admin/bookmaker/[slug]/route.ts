import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

const ALLOWED_ADMINS = (process.env.ALLOWED_ADMINS || '').split(',').filter(Boolean);

async function checkAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return false;
  }
  if (ALLOWED_ADMINS.length > 0 && !ALLOWED_ADMINS.includes(session.user.email)) {
    return false;
  }
  return true;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const isAuthed = await checkAuth();
  if (!isAuthed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = params;
  const filePath = path.join(process.cwd(), 'content', `${slug}-full.json`);

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return NextResponse.json(JSON.parse(content));
  } catch (error) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const isAuthed = await checkAuth();
  if (!isAuthed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = params;
  const filePath = path.join(process.cwd(), 'content', `${slug}-full.json`);

  try {
    const data = await request.json();

    // Update timestamps
    data.updatedAt = new Date().toISOString().split('T')[0];

    // Write to file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving bookmaker data:', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
