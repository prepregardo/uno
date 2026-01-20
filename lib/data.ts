/**
 * Data Abstraction Layer
 *
 * This layer provides a unified interface for data access.
 * It supports two modes:
 * - JSON files (current, for development and small scale)
 * - PostgreSQL via Prisma (for production at scale)
 *
 * Set USE_DATABASE=true in .env to switch to PostgreSQL
 */

import fs from 'fs';
import path from 'path';
import { cached, cacheDelPattern } from './cache';

// Check if we should use database
const USE_DATABASE = process.env.USE_DATABASE === 'true';

// Lazy load Prisma only when needed
let prismaClient: any = null;
async function getPrisma() {
  if (!prismaClient) {
    const { prisma } = await import('./prisma');
    prismaClient = prisma;
  }
  return prismaClient;
}

// ============================================
// Types (matching both JSON and DB structure)
// ============================================

// Using 'any' for JSON data to maintain compatibility with existing structure
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BookmakerData = Record<string, any>;

export interface BookmakerListItem {
  slug: string;
  name: string;
  rating: number;
  bonus: string;
  logo?: string;
  reviewsCount: number;
}

// ============================================
// JSON Data Source
// ============================================

async function getBookmakerFromJSON(slug: string): Promise<BookmakerData | null> {
  const filePath = path.join(process.cwd(), 'content', `${slug}-full.json`);
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function getAllBookmakersFromJSON(): Promise<BookmakerListItem[]> {
  const contentDir = path.join(process.cwd(), 'content');
  try {
    const files = fs.readdirSync(contentDir).filter(f => f.endsWith('-full.json'));
    const bookmakers: BookmakerListItem[] = [];

    for (const file of files) {
      const content = fs.readFileSync(path.join(contentDir, file), 'utf-8');
      const data = JSON.parse(content);
      bookmakers.push({
        slug: data.slug || file.replace('-full.json', ''),
        name: data.name,
        rating: data.navigator?.rating || 0,
        bonus: data.navigator?.bonus || '',
        reviewsCount: data.stats?.reviewsCount || 0,
      });
    }

    return bookmakers.sort((a, b) => b.rating - a.rating);
  } catch {
    return [];
  }
}

async function getBookmakerSlugsFromJSON(): Promise<string[]> {
  const contentDir = path.join(process.cwd(), 'content');
  try {
    const files = fs.readdirSync(contentDir).filter(f => f.endsWith('-full.json'));
    return files.map(f => f.replace('-full.json', ''));
  } catch {
    return [];
  }
}

// ============================================
// Database Data Source
// ============================================

async function getBookmakerFromDB(slug: string): Promise<BookmakerData | null> {
  const prisma = await getPrisma();

  const bookmaker = await prisma.bookmaker.findUnique({
    where: { slug },
    include: {
      pros: { orderBy: { order: 'asc' } },
      cons: { orderBy: { order: 'asc' } },
      faq: { orderBy: { order: 'asc' } },
      payments: { include: { payment: true } },
      apps: true,
      bonuses: { where: { isActive: true } },
    },
  });

  if (!bookmaker) return null;

  // Transform DB structure to BookmakerData
  return {
    name: bookmaker.name,
    slug: bookmaker.slug,
    description: bookmaker.description || '',
    website: bookmaker.website || '',

    navigator: {
      rating: bookmaker.rating,
      founded: bookmaker.founded || 0,
      minDeposit: bookmaker.minDeposit || 0,
      minWithdraw: bookmaker.minWithdraw || 0,
      bonus: bookmaker.bonus || '',
      license: bookmaker.license || '',
    },

    stats: {
      reviewsCount: bookmaker.reviewsCount,
      complaintsTotal: bookmaker.complaintsCount,
      questionsCount: bookmaker.questionsCount,
      viewsCount: bookmaker.viewsCount,
    },

    company: bookmaker.companyName ? {
      name: bookmaker.companyName,
      address: bookmaker.companyAddress || '',
      country: bookmaker.companyCountry || '',
    } : undefined,

    support: {
      email: bookmaker.supportEmail || '',
      phone: bookmaker.supportPhone || '',
      chat: bookmaker.supportChat,
    },

    ratings: {
      overall: bookmaker.rating,
      live: bookmaker.ratingLive || 0,
      line: bookmaker.ratingLine || 0,
      odds: bookmaker.ratingOdds || 0,
      bonus: bookmaker.ratingBonus || 0,
      support: bookmaker.ratingSupport || 0,
      payments: bookmaker.ratingPayments || 0,
      mobile: bookmaker.ratingMobile || 0,
    },

    videoReview: bookmaker.videoYoutubeId ? {
      youtubeId: bookmaker.videoYoutubeId,
    } : undefined,

    pros: bookmaker.pros.map((p: any) => p.text),
    cons: bookmaker.cons.map((c: any) => c.text),
    faq: bookmaker.faq.map((f: any) => ({
      question: f.question,
      answer: f.answer,
    })),
    payments: bookmaker.payments.map((p: any) => ({
      name: p.payment.name,
      type: p.payment.type,
    })),
    apps: bookmaker.apps.map((a: any) => ({
      platform: a.platform,
      url: a.url || '',
      version: a.version || '',
    })),
    bonuses: bookmaker.bonuses.map((b: any) => ({
      title: b.title,
      amount: b.amount || '',
      code: b.code,
      type: b.type,
    })),

    seo: {
      title: bookmaker.seoTitle || `${bookmaker.name} - обзор букмекера`,
      description: bookmaker.seoDescription || bookmaker.description || '',
    },
  };
}

async function getAllBookmakersFromDB(): Promise<BookmakerListItem[]> {
  const prisma = await getPrisma();

  const bookmakers = await prisma.bookmaker.findMany({
    where: { status: 'ACTIVE' },
    select: {
      slug: true,
      name: true,
      rating: true,
      bonus: true,
      logo: true,
      reviewsCount: true,
    },
    orderBy: { rating: 'desc' },
  });

  return bookmakers.map((b: any) => ({
    slug: b.slug,
    name: b.name,
    rating: b.rating,
    bonus: b.bonus || '',
    logo: b.logo,
    reviewsCount: b.reviewsCount,
  }));
}

async function getBookmakerSlugsFromDB(): Promise<string[]> {
  const prisma = await getPrisma();

  const bookmakers = await prisma.bookmaker.findMany({
    where: { status: 'ACTIVE' },
    select: { slug: true },
  });

  return bookmakers.map((b: any) => b.slug);
}

// ============================================
// Public API (with caching)
// ============================================

/**
 * Get a single bookmaker by slug
 */
export async function getBookmaker(slug: string): Promise<BookmakerData | null> {
  return cached(
    `bookmaker:${slug}`,
    async () => {
      if (USE_DATABASE) {
        return getBookmakerFromDB(slug);
      }
      return getBookmakerFromJSON(slug);
    },
    'bookmaker'
  );
}

/**
 * Get all bookmakers (for listings)
 */
export async function getAllBookmakers(): Promise<BookmakerListItem[]> {
  return cached(
    'bookmakers:all',
    async () => {
      if (USE_DATABASE) {
        return getAllBookmakersFromDB();
      }
      return getAllBookmakersFromJSON();
    },
    'bookmakerList'
  );
}

/**
 * Get all bookmaker slugs (for static generation)
 */
export async function getBookmakerSlugs(): Promise<string[]> {
  if (USE_DATABASE) {
    return getBookmakerSlugsFromDB();
  }
  return getBookmakerSlugsFromJSON();
}

/**
 * Invalidate cache for a bookmaker
 */
export async function invalidateBookmakerCache(slug: string): Promise<void> {
  await cacheDelPattern(`bookmaker:${slug}*`);
  await cacheDelPattern('bookmakers:*');
}

/**
 * Invalidate all bookmaker caches
 */
export async function invalidateAllBookmakerCaches(): Promise<void> {
  await cacheDelPattern('bookmaker:*');
  await cacheDelPattern('bookmakers:*');
}

// ============================================
// Data mode info
// ============================================

export function getDataMode(): 'json' | 'database' {
  return USE_DATABASE ? 'database' : 'json';
}
