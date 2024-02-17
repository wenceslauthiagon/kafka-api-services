import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  NotImplementedException,
  NullPointerException,
  ProtocolType,
} from '@zro/common';
import { JdpiAuthClient } from '@zro/api-jdpi/domain';

/**
 * Get request auth client.
 */
export const JdpiAuthClientParam = createParamDecorator(
  (Class: any, context: ExecutionContext): JdpiAuthClient => {
    let request: any = null;

    const protocol = context.getType();
    if (protocol === ProtocolType.HTTP) {
      const ctx = context.switchToHttp();
      request = ctx.getRequest();
    } else {
      throw new NotImplementedException(
        `Protocol ${protocol} is not implemented.`,
      );
    }

    if (!request.user) {
      throw new NullPointerException(
        'Request user is not defined. Check if JwtAuthGuard is available.',
      );
    }

    return request.user;
  },
);
