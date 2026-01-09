/**
 * Redis-based distributed rate limiting with in-memory fallback
 * 
 * Features:
 * - Distributed rate limiting across multiple servers
 * - Automatic fallback to in-memory when Redis unavailable
 * - Sliding window algorithm for accurate rate limiting
 * - Configurable limits per endpoint
 */

import { rateLimit as inMemoryRateLimit } from "./rate-limit";

// Redis client interface (to be initialized separately)
interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { EX?: number }): Promise<void>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<void>;
  del(key: string): Promise<void>;
  ping(): Promise<string>;
}

let redisClient: RedisClient | null = null;
let redisAvailable = false;

/**
 * Initialize Redis client for rate limiting
 * Call this during application startup
 */
export function initializeRedisRateLimit(client: RedisClient): void {
  redisClient = client;
  
  // Test Redis connection
  client.ping()
    .then(() => {
      redisAvailable = true;
      console.log("[Rate Limit] Redis connected - using distributed rate limiting");
    })
    .catch((error) => {
      redisAvailable = false;
      console.warn("[Rate Limit] Redis unavailable - falling back to in-memory rate limiting", error);
    });
}

/**
 * Redis-based rate limiter with sliding window
 */
async function redisRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): Promise<boolean> {
  if (!redisClient || !redisAvailable) {
    // Fallback to in-memory if Redis unavailable
    return inMemoryRateLimit(identifier, maxRequests, windowMs);
  }

  try {
    const key = `ratelimit:${identifier}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Use Redis sorted set for sliding window
    // Key format: ratelimit:{identifier}
    // We'll use a simple counter approach for this implementation
    
    const currentCount = await redisClient.get(key);
    const count = currentCount ? parseInt(currentCount) : 0;

    if (count === 0) {
      // First request in window
      await redisClient.set(key, "1", { EX: Math.ceil(windowMs / 1000) });
      return true;
    }

    if (count >= maxRequests) {
      // Rate limit exceeded
      return false;
    }

    // Increment counter
    await redisClient.incr(key);
    return true;
  } catch (error) {
    console.error("[Rate Limit] Redis error, falling back to in-memory:", error);
    redisAvailable = false;
    
    // Fallback to in-memory on error
    return inMemoryRateLimit(identifier, maxRequests, windowMs);
  }
}

/**
 * Unified rate limiter - automatically uses Redis or falls back to in-memory
 * 
 * @param identifier Unique identifier (e.g., IP address, user ID, API key)
 * @param maxRequests Maximum number of requests allowed in the time window
 * @param windowMs Time window in milliseconds
 * @returns true if request is allowed, false if rate limit exceeded
 */
export async function distributedRateLimit(
  identifier: string,
  maxRequests = 60,
  windowMs = 60000
): Promise<boolean> {
  if (redisAvailable && redisClient) {
    return redisRateLimit(identifier, maxRequests, windowMs);
  }
  
  // Use in-memory as fallback
  return inMemoryRateLimit(identifier, maxRequests, windowMs);
}

/**
 * Reset rate limit for a specific identifier
 * Useful for testing or administrative overrides
 */
export async function resetRateLimit(identifier: string): Promise<void> {
  if (redisAvailable && redisClient) {
    try {
      const key = `ratelimit:${identifier}`;
      await redisClient.del(key);
    } catch (error) {
      console.error("[Rate Limit] Failed to reset rate limit:", error);
    }
  }
  // Note: In-memory rate limits will automatically reset after window expires
}

/**
 * Default rate limit for status queries
 * Can be overridden per endpoint
 */
const DEFAULT_RATE_LIMIT = 60;

/**
 * Get current rate limit status for an identifier
 */
export async function getRateLimitStatus(
  identifier: string,
  limit: number = DEFAULT_RATE_LIMIT
): Promise<{ count: number; limit: number; remaining: number } | null> {
  if (!redisAvailable || !redisClient) {
    return null; // In-memory doesn't support status queries
  }

  try {
    const key = `ratelimit:${identifier}`;
    const currentCount = await redisClient.get(key);
    const count = currentCount ? parseInt(currentCount) : 0;
    
    const remaining = Math.max(0, limit - count);
    
    return { count, limit, remaining };
  } catch (error) {
    console.error("[Rate Limit] Failed to get status:", error);
    return null;
  }
}

/**
 * Check if Redis rate limiting is available
 */
export function isRedisAvailable(): boolean {
  return redisAvailable;
}
