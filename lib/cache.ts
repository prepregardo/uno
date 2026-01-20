import { Redis } from '@upstash/redis';

// Redis client singleton
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn('Redis not configured - caching disabled');
    return null;
  }

  redis = new Redis({ url, token });
  return redis;
}

// Cache TTL in seconds
const CACHE_TTL = {
  bookmaker: 3600,      // 1 hour
  bookmakerList: 1800,  // 30 minutes
  review: 300,          // 5 minutes
  bonus: 1800,          // 30 minutes
  stats: 60,            // 1 minute
};

export type CacheKey = keyof typeof CACHE_TTL;

/**
 * Get data from cache
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedis();
  if (!client) return null;

  try {
    const data = await client.get<T>(key);
    return data;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

/**
 * Set data in cache with TTL
 */
export async function cacheSet<T>(
  key: string,
  data: T,
  type: CacheKey = 'bookmaker'
): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    await client.setex(key, CACHE_TTL[type], JSON.stringify(data));
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

/**
 * Delete from cache
 */
export async function cacheDel(key: string): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    await client.del(key);
  } catch (error) {
    console.error('Cache del error:', error);
  }
}

/**
 * Delete multiple keys by pattern
 */
export async function cacheDelPattern(pattern: string): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch (error) {
    console.error('Cache del pattern error:', error);
  }
}

/**
 * Cache wrapper - get from cache or fetch and cache
 */
export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  type: CacheKey = 'bookmaker'
): Promise<T> {
  // Try cache first
  const cachedData = await cacheGet<T>(key);
  if (cachedData) {
    return cachedData;
  }

  // Fetch fresh data
  const freshData = await fetcher();

  // Cache it
  await cacheSet(key, freshData, type);

  return freshData;
}
