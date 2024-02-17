import { SetMetadata } from '@nestjs/common';
import { Milliseconds } from 'cache-manager';

export const REPLAY_PROTECTION_TTL_KEY = 'ReplayProtectionTTL';

/**
 * Reply protection decorator. Controllers or handlers decorated with
 * @EnableReplayProtection are protected by ReplyGuard.
 * @param ttl Protection TTL in milliseconds. Default is 2h.
 */
export const EnableReplayProtection = (
  ttl: Milliseconds = 2 * 60 * 60 * 1000,
) => SetMetadata(REPLAY_PROTECTION_TTL_KEY, ttl);
