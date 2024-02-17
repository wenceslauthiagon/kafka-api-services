import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  NotImplementedException,
} from '@nestjs/common';
import { Logger } from 'winston';
import { Observable, catchError, throwError } from 'rxjs';
import { InjectLogger } from '../modules/logger.module';
import { UnknownException } from '../exceptions/unknown.exception';
import { DefaultException } from '../helpers/error.helper';
import { ProtocolType } from '../helpers/protocol.helper';

/**
 * Intercepts all not handled exceptions.
 */
@Injectable()
export class ExceptionInterceptor implements NestInterceptor {
  constructor(@InjectLogger() private readonly logger: Logger) {
    this.logger = logger.child({ context: ExceptionInterceptor.name });
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    let request: any = null;

    const protocol = context.getType();
    if (protocol === ProtocolType.HTTP) {
      const ctx = context.switchToHttp();
      request = ctx.getRequest();
    } else if (protocol === ProtocolType.RPC) {
      const ctx = context.switchToRpc();
      request = ctx.getContext();
    } else {
      throw new NotImplementedException(
        `Protocol ${protocol} is not implemented.`,
      );
    }

    const logger: Logger =
      request.logger?.child({ context: ExceptionInterceptor.name }) ??
      this.logger;

    return next.handle().pipe(
      catchError((error) => {
        if (error instanceof DefaultException) {
          logger.debug('Captured a default exception.', { error });
          return throwError(() => error);
        }

        logger.debug('Captured an unhandled exception.', {
          error: error.message,
          stack: error.stack,
        });
        return throwError(() => new UnknownException(error));
      }),
    );
  }
}
