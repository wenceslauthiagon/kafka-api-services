import {
  Catch,
  ArgumentsHost,
  ExceptionFilter,
  HttpStatus,
  HttpException,
  Optional,
} from '@nestjs/common';
import { Logger } from 'winston';
import { Response } from 'express';
import { Cache } from 'cache-manager';
import { snakeCase } from 'snake-case';
import { Observable, throwError } from 'rxjs';
import { InjectCache, InjectLogger, TranslateService } from '../modules';
import { DefaultException, ExceptionTypes, ProtocolType } from '../helpers';
import { NotImplementedException, ValidationException } from '../exceptions';

/**
 * Capture all default exception thrown by services.
 */
@Catch(DefaultException)
export class DefaultExceptionFilter
  implements ExceptionFilter<DefaultException>
{
  /**
   * Default constructor.
   * @param logger Global logger.
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    @InjectCache() private readonly cache: Cache,
    @Optional() private readonly translateService?: TranslateService,
  ) {
    this.logger = logger.child({ context: DefaultExceptionFilter.name });
  }

  /**
   * Process default exceptions.
   * @param exception Default exception catched.
   * @param host Request context.
   */
  catch(exception: DefaultException, host: ArgumentsHost): Observable<any> {
    const protocol = host.getType();
    if (protocol === ProtocolType.RPC) {
      // Add catch error to cause by stack in RPC reply message
      exception.causedByStack.push(exception.stack);

      // Stringify exception to send it through kafka
      return throwError(() => JSON.stringify({ ...exception }));
    } else if (protocol === ProtocolType.HTTP) {
      const ctx = host.switchToHttp();
      const request = ctx.getRequest();
      const response = ctx.getResponse<Response>();

      const logger = this.logger.child({ loggerId: request.id });

      // Remove replay protection in case of exception
      if (request.replyProtection) {
        this.cache.del(request.replyProtection);
      }

      if (
        [ExceptionTypes.SYSTEM, ExceptionTypes.UNKNOWN].includes(exception.type)
      ) {
        logger.error('INTERNAL ERROR', { exception });
      } else {
        logger.debug('User error.', { exception });
      }

      // Did exception happen because a user miss information or system bug?
      let status = HttpStatus.INTERNAL_SERVER_ERROR;

      switch (exception.type) {
        case ExceptionTypes.USER:
        case ExceptionTypes.ADMIN:
          status = HttpStatus.UNPROCESSABLE_ENTITY;
          break;
        case ExceptionTypes.FORBIDDEN:
          status = HttpStatus.FORBIDDEN;
          break;
        case ExceptionTypes.UNAUTHORIZED:
          status = HttpStatus.UNAUTHORIZED;
          break;
        case ExceptionTypes.CONFLICT:
          status = HttpStatus.CONFLICT;
          break;
      }

      logException(logger, request, status);

      this.translateException(exception).then(async (message) => {
        // Reply to user
        response.status(status).json({
          success: false,
          data: null,
          error: exception.isUserError()
            ? ExceptionTypes.USER
            : ExceptionTypes.SYSTEM,
          message,
        });
      });
    } else {
      // Sanity check. This will never happen. (I believe).
      throw new NotImplementedException(
        `Protocol ${protocol} is not implemented.`,
      );
    }
  }

  async translateException(exception: DefaultException): Promise<string> {
    // If there is no translation service configured.
    if (!this.translateService) {
      return Promise.resolve(exception.code);
    }

    // If is not a validation exception, then use code as translation key.
    if (!(exception instanceof ValidationException)) {
      return this.translateService.translate(
        'default_exceptions',
        exception.code,
        exception.data,
      );
    }
    // Else translate all validation errors.
    else {
      const messages = [];
      for (const error of exception.data) {
        for (const constraint in error.constraints) {
          const constraintCode =
            snakeCase(constraint)?.toUpperCase() ?? 'DEFAULT';
          const message = await this.translateService.translate(
            'validation_exceptions',
            constraintCode,
            error,
          );
          messages.push(message);
        }
      }
      return messages.join(' ');
    }
  }
}

/**
 * Capture all default exception thrown by services.
 */
@Catch(DefaultException)
export class ApiAsServiceDefaultExceptionFilter
  implements ExceptionFilter<DefaultException>
{
  /**
   * Default constructor.
   * @param logger Global logger.
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    @InjectCache() private readonly cache: Cache,
    @Optional() private readonly translateService?: TranslateService,
  ) {
    this.logger = logger.child({ context: DefaultExceptionFilter.name });
  }

  /**
   * Process default exceptions.
   * @param exception Default exception catched.
   * @param host Request context.
   */
  catch(exception: DefaultException, host: ArgumentsHost): Observable<any> {
    const protocol = host.getType();
    if (protocol === ProtocolType.RPC) {
      // Add catch error to cause by stack in RPC reply message
      exception.causedByStack.push(exception.stack);

      // Stringify exception to send it through kafka
      return throwError(() => JSON.stringify({ ...exception }));
    } else if (protocol === ProtocolType.HTTP) {
      const ctx = host.switchToHttp();
      const request = ctx.getRequest();
      const response = ctx.getResponse<Response>();

      const logger = this.logger.child({ loggerId: request.id });

      // Remove replay protection in case of exception
      if (request.replyProtection) {
        this.cache.del(request.replyProtection);
      }

      if (
        [ExceptionTypes.SYSTEM, ExceptionTypes.UNKNOWN].includes(exception.type)
      ) {
        logger.error('INTERNAL ERROR', { exception });
      } else {
        logger.debug('User error.', { exception });
      }

      // Did exception happen because a user miss information or system bug?
      let status = HttpStatus.INTERNAL_SERVER_ERROR;

      switch (exception.type) {
        case ExceptionTypes.USER:
        case ExceptionTypes.ADMIN:
          status = HttpStatus.UNPROCESSABLE_ENTITY;
          break;
        case ExceptionTypes.FORBIDDEN:
          status = HttpStatus.FORBIDDEN;
          break;
        case ExceptionTypes.UNAUTHORIZED:
          status = HttpStatus.UNAUTHORIZED;
          break;
        case ExceptionTypes.CONFLICT:
          status = HttpStatus.CONFLICT;
          break;
      }

      logException(logger, request, status);

      this.translateException(exception).then(async (message) => {
        // Reply to user
        response.status(status).json({
          success: false,
          data: null,
          error: exception.isUserError()
            ? ExceptionTypes.USER
            : ExceptionTypes.SYSTEM,
          message,
          code: exception.code,
        });
      });
    } else {
      // Sanity check. This will never happen. (I believe).
      throw new NotImplementedException(
        `Protocol ${protocol} is not implemented.`,
      );
    }
  }

  async translateException(exception: DefaultException): Promise<string> {
    // If there is no translation service configured.
    if (!this.translateService) {
      return Promise.resolve(exception.code);
    }

    // If is not a validation exception, then use code as translation key.
    if (!(exception instanceof ValidationException)) {
      return this.translateService.translate(
        'default_exceptions',
        exception.code,
        exception.data,
      );
    }
    // Else translate all validation errors.
    else {
      const messages = [];
      for (const error of exception.data) {
        for (const constraint in error.constraints) {
          const constraintCode =
            snakeCase(constraint)?.toUpperCase() ?? 'DEFAULT';
          const message = await this.translateService.translate(
            'validation_exceptions',
            constraintCode,
            error,
          );
          messages.push(message);
        }
      }
      return messages.join(' ');
    }
  }
}

/**
 * Process HTTP exception.
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter<HttpException> {
  /**
   * Default constructor.
   * @param logger Global logger.
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    @InjectCache() private cache: Cache,
    @Optional() private readonly translateService?: TranslateService,
  ) {
    this.logger = logger.child({ context: HttpExceptionFilter.name });
  }

  /**
   * Process HTTP exceptions.
   * @param exception HTTP exception catched.
   * @param host Request context.
   */
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    const logger = this.logger.child({ loggerId: request.id });

    // Remove replay protection in case of exception
    if (request.replyProtection) {
      this.cache.del(request.replyProtection);
    }

    logException(logger, request, status);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      logger.error('INTERNAL ERROR', { exception });
    } else {
      logger.debug('USER ERROR.', { exception });
    }

    this.translateException(exception).then(async (message: string) => {
      // Reply to user
      response.status(status).json({
        success: false,
        data: null,
        error:
          status < HttpStatus.INTERNAL_SERVER_ERROR
            ? ExceptionTypes.USER
            : ExceptionTypes.SYSTEM,
        message,
      });
    });
  }

  async translateException(exception: HttpException) {
    // If there is no translation service configured.
    if (!this.translateService) {
      return Promise.resolve('Error ' + exception.getStatus());
    }

    // If is not a validation exception, then use code as translation key.
    return this.translateService.translate(
      'http_exceptions',
      `HTTP_STATUS_${exception.getStatus()}`,
    );
  }
}

function logException(logger: Logger, request: any, status: number) {
  const { id, ip, originalUrl, method } = request;

  if (request.user) {
    request.userId =
      request.user.uuid ?? request.user.id ?? request.user.phoneNumber;
    request.userApiId = request.user.apiId;
  }

  const userAgent: string = request.get('user-agent') || 'NO_AGENT';
  const userId: string = request.userId ?? '-';
  const clientIp: string = request.headers['cf-connecting-ip'] ?? ip;
  const nonce: string = request.headers['nonce'] ?? '-';
  const userApiId: string = request.userApiId ?? '-';

  logger.info(
    `RES: ${id} <| ${userId} |> ${userApiId} | ${method} ${originalUrl} ${status} | ${userAgent} ${clientIp} ${nonce}`,
  );
}
