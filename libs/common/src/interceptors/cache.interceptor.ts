import { createHash } from 'crypto';
import { isDefined } from 'class-validator';
import { Cache, Milliseconds } from 'cache-manager';
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of, tap } from 'rxjs';
import { InjectCache } from '../modules/cache.module';
import { ProtocolType } from '../helpers/protocol.helper';
import { CACHE_TTL_KEY } from '../decorators/cache.decorator';
import { NotImplementedException } from '../exceptions/not_implemented.exception';

/**
 * Intercept requests and check if a similar request was cached before send it
 * to controller.
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  /**
   * Default constructor.
   * @param reflector Global reflector instance.
   * @param cache Global cache instance.
   */
  constructor(
    private readonly reflector: Reflector,
    @InjectCache() private readonly cache: Cache,
  ) {}

  /**
   * Intercept request to check if a similar one exists in cache. If not exists
   * add it to cache.
   * @param context Execution context.
   * @param next Next function.
   * @returns Execution pipeline.
   */
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    // Check if requested controller or handler has cache protection.
    // Controller or handler decorated with @EnableReplayProtection fails if
    // exists a similar request stored in cache.
    const ttl = this.reflector.getAllAndOverride<number>(CACHE_TTL_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If the cache is not configured to the controller or handler, execute them.
    if (!ttl) {
      return next.handle();
    }

    // Http and RPC protocols have different message format.
    const protocol = context.getType();
    if (protocol === ProtocolType.HTTP) {
      return this.interceptHttp(context, next, ttl);
    } else if (protocol === ProtocolType.RPC) {
      return this.interceptRpc(context, next, ttl);
    } else {
      throw new NotImplementedException(
        `Protocol ${protocol} is not implemented.`,
      );
    }
  }

  private getCacheKey(hash: string) {
    return `request-${hash}`;
  }

  /**
   * Intercept request and add a logger.
   * @param context Execution context.
   * @param next Next function.
   * @param ttl Cache TTL in ms.
   * @returns Execution pipeline.
   */
  private async interceptRpc(
    context: ExecutionContext,
    next: CallHandler,
    ttl: Milliseconds,
  ): Promise<Observable<any>> {
    const ctx = context.switchToRpc();
    const req = ctx.getContext();

    const message = req.getMessage?.();
    const value = message?.value;
    const topic = req.getTopic();

    const request = { value, topic };

    const hash = createHash('sha1')
      .update(JSON.stringify(request))
      .digest('base64');

    // Check if a similar request exists on cache.
    const cachedResponse = await this.cache.get<any>(this.getCacheKey(hash));

    if (cachedResponse) {
      // Checks if the answer is null to parse the null value
      const response = cachedResponse.__is_null__ ? null : cachedResponse;
      return of({
        key: message?.key,
        headers: message?.headers,
        value: response,
      });
    }

    return next.handle().pipe(
      // Did execute successfully and return data?
      tap(async (data) => {
        // Checks if the data value is null to parse the null object
        const response = isDefined(data.value)
          ? data.value
          : { __is_null__: true };

        await this.cache.set(this.getCacheKey(hash), response, ttl);
      }),
    );
  }

  /**
   * Intercept request and add a logger.
   * @param context Execution context.
   * @param next Next function.
   * @param ttl Cache TTL in ms.
   * @returns Execution pipeline.
   */
  private async interceptHttp(
    context: ExecutionContext,
    next: CallHandler,
    ttl: Milliseconds,
  ): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();
    const { originalUrl, method, params, query, body } = req;

    // Build a hash from request data.
    const userId = req.user.uuid ?? req.user.id ?? req.user.phoneNumber;

    const request = {
      method,
      originalUrl,
      params,
      body,
      query,
      userId,
    };

    const hash = createHash('sha1')
      .update(JSON.stringify(request))
      .digest('base64');

    // Check if exists a similar request in cache.
    const cachedResponse = await this.cache.get<any>(this.getCacheKey(hash));

    // If exists, return it.
    if (cachedResponse) {
      return of(cachedResponse);
    }

    // If not, go to controller.
    return next.handle().pipe(
      // Did execute successfully and return data?
      tap(async (data) => {
        await this.cache.set(this.getCacheKey(hash), data, ttl);
      }),
    );
  }
}
