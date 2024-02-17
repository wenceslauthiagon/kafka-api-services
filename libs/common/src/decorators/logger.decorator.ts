import { Logger } from 'winston';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { NotImplementedException } from '../exceptions/not_implemented.exception';
import { NullPointerException } from '../exceptions/null_pointer.exception';
import { ProtocolType } from '../helpers/protocol.helper';

/**
 * Get request logger.
 */
export const LoggerParam = createParamDecorator(
  (Class: any, context: ExecutionContext): Logger => {
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

    if (!request.logger) {
      throw new NullPointerException(
        'Request logger is not defined. Check if LoggerInterceptor is available.',
      );
    }

    return request.logger.child({ context: Class.name });
  },
);
