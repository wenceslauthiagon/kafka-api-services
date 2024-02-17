import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Logger } from 'winston';
import { trace } from '@opentelemetry/api';
import { catchError, tap } from 'rxjs/operators';
import { InjectLogger } from '../modules';
import { ExceptionTypes } from '../helpers/error.constants';

@Injectable()
export class HttpLoggerInterceptor implements NestInterceptor {
  constructor(@InjectLogger() private readonly logger: Logger) {
    this.logger = logger.child({ context: HttpLoggerInterceptor.name });
  }

  intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest();
    const { id, ip, originalUrl, method, headers, params, query, body, path } =
      req;
    const userAgent = req.get('user-agent') || 'NO_AGENT';

    // Prefer request logger instance.
    const logger = (req.logger ?? this.logger).child({
      context: HttpLoggerInterceptor.name,
    });

    const activeSpan = trace?.getActiveSpan();

    const request: any = {
      id,
      method,
      originalUrl,
      userAgent,
      ip,
      path,
      spanId: activeSpan?.spanContext()?.spanId,
      traceId: activeSpan?.spanContext()?.traceId,
    };

    // FIXME: Adicionar um metadata nos controllers para indicar a remocao do log.
    const protectedUlrs =
      originalUrl.startsWith('/v1/auth') ||
      originalUrl.startsWith('/v2/auth') ||
      originalUrl.startsWith('/auth') ||
      originalUrl.startsWith('/storage') ||
      originalUrl.startsWith('/signup') ||
      originalUrl.startsWith('/users/pin') ||
      originalUrl.startsWith('/payments-gateway/transactions') ||
      originalUrl.startsWith('/notify/') || // Related to API-JIRA endpoints. Is is necessary the '/' in the end because API-TOPAZIO endpoints start with '/notify-'.
      originalUrl.includes('/files/download') ||
      originalUrl.includes('/files/upload');

    // Exclude sensitive information from log.
    if (!protectedUlrs) {
      request.params = params;
      request.body = body;
      request.query = query;
    }

    if (req.user) {
      request.userId = req.user.uuid ?? req.user.id ?? req.user.phoneNumber;
      request.userApiId = req.user.apiId;
    }

    request.headers = Object.assign({}, headers, {
      authorization: 'Protected',
      cookie: 'Protected',
      'x-access-token': 'Protected',
    });

    const userId: string = request.userId ?? '-';
    const clientIp: string = request.headers['cf-connecting-ip'] ?? ip;
    const nonce: string = request.headers['nonce'] ?? '-';
    const userApiId: string = request.userApiId ?? '-';

    logger.info(
      `REQ: ${id} <| ${userId} |> ${userApiId} | ${method} ${originalUrl} - ${userAgent} ${clientIp} ${nonce}`,
      { request },
    );

    const start = Date.now();

    return next.handle().pipe(
      tap((data) => {
        const res = context.switchToHttp().getResponse();
        const { statusCode } = res;
        const elapsedTime = Date.now() - start;

        const response: any = { statusCode, elapsedTime };

        // Exclude sensitive information from log.
        if (!protectedUlrs) {
          response.data = data;
        }

        logger.info(
          `RES: ${id} <| ${userId} |> ${userApiId} | ${method} ${originalUrl} ${statusCode} | ${userAgent} ${clientIp} ${nonce} | ${elapsedTime}ms`,
          { request, response },
        );
      }),
      catchError((error) => {
        const elapsedTime = Date.now() - start;

        const statusCode =
          error.type === ExceptionTypes.USER
            ? HttpStatus.UNPROCESSABLE_ENTITY
            : HttpStatus.INTERNAL_SERVER_ERROR;

        const response = {
          statusCode,
          elapsedTime,
          error,
        };

        logger.info(
          `RES: ${id} <| ${userId} |> ${userApiId} | ${method} ${originalUrl} ${statusCode} | ${userAgent} ${clientIp} ${nonce} | ${elapsedTime}ms`,
          { request, response },
        );

        throw error;
      }),
    );
  }
}
