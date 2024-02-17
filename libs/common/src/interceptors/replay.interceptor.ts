import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Logger } from 'winston';
import { Cache } from 'cache-manager';
import { catchError, map } from 'rxjs/operators';
import { InjectCache } from '../modules/cache.module';

@Injectable()
export class ReplayInterceptor implements NestInterceptor {
  constructor(
    @InjectCache() private cache: Cache,
    private logger: Logger,
  ) {
    this.logger = logger.child({ context: ReplayInterceptor.name });
  }

  async intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest();

    // Prefer request logger instance.
    const logger = (req.logger ?? this.logger).child({
      context: ReplayInterceptor.name,
    });

    return next.handle().pipe(
      map((data) => data),
      catchError(async (error) => {
        // If found an error, then remove created cache entry.
        if (req.replyProtection) {
          logger.debug('Cancel cache miss.', { hashKey: req.replyProtection });
          await this.cache.del(req.replyProtection);
          delete req.replyProtection;
        }

        throw error;
      }),
    );
  }
}
