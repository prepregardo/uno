import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { invalidateBookmakerCache, invalidateAllBookmakerCaches } from '@/lib/data';

// Secret token for revalidation (set in .env)
const REVALIDATE_TOKEN = process.env.REVALIDATE_TOKEN;

/**
 * On-demand ISR Revalidation API
 *
 * Usage:
 * POST /api/revalidate
 * Headers: { Authorization: Bearer <REVALIDATE_TOKEN> }
 * Body: { type: 'bookmaker', slug: 'winline' }
 *       or { type: 'all' }
 *       or { type: 'path', path: '/bookmakers' }
 */
export async function POST(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!REVALIDATE_TOKEN || token !== REVALIDATE_TOKEN) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { type, slug, path: pathToRevalidate } = body;

    switch (type) {
      case 'bookmaker':
        if (!slug) {
          return NextResponse.json(
            { error: 'Slug is required for bookmaker revalidation' },
            { status: 400 }
          );
        }
        // Revalidate the specific bookmaker page
        revalidatePath(`/bookmaker/${slug}`);
        revalidatePath(`/bookmakers/${slug}`);
        // Invalidate Redis cache
        await invalidateBookmakerCache(slug);
        return NextResponse.json({
          revalidated: true,
          type: 'bookmaker',
          slug,
          timestamp: Date.now(),
        });

      case 'bookmakers':
        // Revalidate all bookmaker listings
        revalidatePath('/bookmakers');
        revalidatePath('/');
        await invalidateAllBookmakerCaches();
        return NextResponse.json({
          revalidated: true,
          type: 'bookmakers',
          timestamp: Date.now(),
        });

      case 'all':
        // Revalidate everything
        revalidatePath('/', 'layout');
        await invalidateAllBookmakerCaches();
        return NextResponse.json({
          revalidated: true,
          type: 'all',
          timestamp: Date.now(),
        });

      case 'path':
        if (!pathToRevalidate) {
          return NextResponse.json(
            { error: 'Path is required for path revalidation' },
            { status: 400 }
          );
        }
        revalidatePath(pathToRevalidate);
        return NextResponse.json({
          revalidated: true,
          type: 'path',
          path: pathToRevalidate,
          timestamp: Date.now(),
        });

      default:
        return NextResponse.json(
          { error: 'Invalid revalidation type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { error: 'Revalidation failed' },
      { status: 500 }
    );
  }
}

// Also support GET for simple revalidation (with query params)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const type = searchParams.get('type') || 'all';
  const slug = searchParams.get('slug');
  const pathToRevalidate = searchParams.get('path');

  if (!REVALIDATE_TOKEN || token !== REVALIDATE_TOKEN) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }

  // Construct request body and call POST handler logic
  const body = { type, slug, path: pathToRevalidate };

  try {
    switch (type) {
      case 'bookmaker':
        if (!slug) {
          return NextResponse.json(
            { error: 'Slug is required' },
            { status: 400 }
          );
        }
        revalidatePath(`/bookmaker/${slug}`);
        revalidatePath(`/bookmakers/${slug}`);
        await invalidateBookmakerCache(slug);
        break;

      case 'bookmakers':
        revalidatePath('/bookmakers');
        revalidatePath('/');
        await invalidateAllBookmakerCaches();
        break;

      case 'all':
        revalidatePath('/', 'layout');
        await invalidateAllBookmakerCaches();
        break;

      case 'path':
        if (pathToRevalidate) {
          revalidatePath(pathToRevalidate);
        }
        break;
    }

    return NextResponse.json({
      revalidated: true,
      ...body,
      timestamp: Date.now(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Revalidation failed' },
      { status: 500 }
    );
  }
}
