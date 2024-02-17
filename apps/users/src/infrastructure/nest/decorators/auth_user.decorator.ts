import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  NotImplementedException,
  NullPointerException,
  ProtocolType,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';

/**
 * Get request auth user.
 */
export const AuthUserParam = createParamDecorator(
  (Class: any, context: ExecutionContext): AuthUser => {
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
