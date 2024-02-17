import { Injectable, NestMiddleware } from '@nestjs/common';
import { Logger } from 'winston';
import { NextFunction } from 'express';
import { InjectLogger } from '../modules';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   */
  constructor(@InjectLogger() private readonly logger: Logger) {
    this.logger = logger.child({ context: LoggerMiddleware.name });
  }

  /**
   * Intercepts request and add an id to the request.
   * @param request HTTP request.
   * @param response HTTP response.
   * @param next Next function.
   */
  use(request: any, response: any, next: NextFunction) {
    // create a logger
    request.logger = this.logger.child({ loggerId: request.id });
    request.logger.debug('Added logger to request.', { requestId: request.id });

    // Go to next middleware on pipeline.
    next();
  }
}
