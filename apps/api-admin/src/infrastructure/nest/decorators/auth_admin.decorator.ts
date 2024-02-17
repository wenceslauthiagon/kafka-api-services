import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthAdmin } from '@zro/api-admin/domain';

import {
  NotImplementedException,
  NullPointerException,
  ProtocolType,
} from '@zro/common';

/**
 * Get request auth admin.
 */
export const AuthAdminParam = createParamDecorator(
  (Class: any, context: ExecutionContext): AuthAdmin => {
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
        'Request admin is not defined. Check if JwtAuthGuard is available.',
      );
    }

    return request.user;
  },
);
