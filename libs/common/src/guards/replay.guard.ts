import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { createHash } from 'crypto';
import { Logger } from 'winston';
import { Reflector } from '@nestjs/core';
import { ReplayException } from '../exceptions';
import { REPLAY_PROTECTION_TTL_KEY } from '../decorators';
import { RedisService } from '../modules';

@Injectable()
export class ReplayGuard implements CanActivate {
  /**
   * Default guard constructor.
   * @param reflector Access to class or method modifiers.
   * @param cache Cache manager.
   * @param logger Logger.
   * @param useNonce UseNonce flag to put in replay payload.
   */
  constructor(
    private readonly reflector: Reflector,
    private readonly cache: Cache,
    private readonly logger: Logger,
    private readonly useNonce: boolean,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger.child({ context: ReplayGuard.name });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if requested controller or handler has reply protection.
    // Controller or handler decorated with @EnableReplayProtection fails if
    // exists a similar request stored in cache.
    const ttl = this.reflector.getAllAndOverride<number>(
      REPLAY_PROTECTION_TTL_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (ttl) {
      const req = context.switchToHttp().getRequest();
      const { path, method, params, query, body, headers } = req;

      // Prefer request logger instance.
      const logger = (req.logger ?? this.logger).child({
        context: ReplayGuard.name,
      });

      // Build a hash from request data.
      const userId = req.user.uuid ?? req.user.id ?? req.user.phoneNumber;

      if (!headers?.['x-transaction-uuid'] && query?.['x-transaction-uuid']) {
        headers['x-transaction-uuid'] = query['x-transaction-uuid'];
        delete query['x-transaction-uuid'];
      }

      if (!headers?.['nonce'] && query?.['nonce']) {
        headers['nonce'] = query['nonce'];
        delete query['nonce'];
      }

      const request: any = {
        method,
        params,
        path,
        query,
        body,
        userId,
      };

      // If transaction_id exists, ignore nonce value.
      if (
        (headers?.['transaction_uuid'] || headers?.['x-transaction-uuid']) &&
        path.includes('p2p-transfers')
      ) {
        request.transaction_id =
          headers?.['transaction_uuid'] || headers?.['x-transaction-uuid'];
      } else if (this.useNonce && headers?.['nonce']) {
        request.nonce = headers['nonce'];
      }

      const hash = createHash('sha1')
        .update(JSON.stringify(request))
        .digest('base64');

      const hashKey = `replay-guard-${hash}`;

      await this.redisService.semaphore(hashKey, async () => {
        // Check if a similar request exists on cache.
        const replayed = await this.cache.get(hashKey);

        // If exists then throw an reply exception.
        if (replayed) {
          logger.warn('Cache hit.', { hashKey });
          throw new ReplayException(hashKey, Math.floor(ttl / 1000));
        }

        logger.debug('Cache miss.', { hashKey });
        await this.cache.set(hashKey, req.id, ttl);
        req.replyProtection = hashKey;
      });
    }

    return true;
  }
}
