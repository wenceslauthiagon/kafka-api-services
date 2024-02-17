import { SetMetadata } from '@nestjs/common';

export const CACHE_TTL_KEY = 'CacheTTL';
export const DEFAULT_CACHE_TTL_S = 60;

/**
 * Cache decorator. Controllers or handlers decorated with
 * @CacheTTL data cached.
 * @param ttlS Data TTL in seconds.
 */
export const CacheTTL = (ttlS = DEFAULT_CACHE_TTL_S) =>
  SetMetadata(CACHE_TTL_KEY, ttlS * 1000);
