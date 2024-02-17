import { Cache, Milliseconds } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'winston';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { InjectCache, InjectLogger, RedisService } from '../modules';

interface NonceGuardConfig {
  APP_NONCE_GUARD_TTL_H: number;
}

@Injectable()
export class NonceGuard implements CanActivate {
  private readonly nonceTtl: Milliseconds;

  /**
   * Default guard constructor.
   * @param cache Cache manager.
   * @param logger Logger.
   * @param configService ConfigService.
   */
  constructor(
    @InjectCache() private readonly cache: Cache,
    @InjectLogger() private readonly logger: Logger,
    configService: ConfigService<NonceGuardConfig>,
    private readonly redisService: RedisService,
  ) {
    this.logger = logger.child({ context: NonceGuard.name });
    this.nonceTtl =
      configService.get<number>('APP_NONCE_GUARD_TTL_H', 1) * 60 * 60 * 1000;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.nonceTtl) {
      const req = context.switchToHttp().getRequest();
      const { headers } = req;

      // Prefer request logger instance.
      const logger = (req.logger ?? this.logger).child({
        context: NonceGuard.name,
      });

      const nonce = headers?.['nonce'];

      // FIXME: Remove this check when headers nonce is required.
      if (!nonce) return true;

      if (!nonce || !isUUID(nonce)) {
        logger.warn('Missing nonce.', { nonce });
        throw new BadRequestException();
      }

      const hashKey = `nonce-${nonce}`;

      await this.redisService.semaphore(hashKey, async () => {
        // Check if a similar request nonce exists on cache.
        const cachedNonce = await this.cache.get(hashKey);

        // If exists then throw an reply exception.
        if (cachedNonce) {
          logger.warn('Nonce cache hit.', { nonce });
          throw new ConflictException();
        }

        logger.debug('Nonce cache miss.', { nonce });

        await this.cache.set(`nonce-${nonce}`, nonce, this.nonceTtl);
      });
    }

    return true;
  }
}
