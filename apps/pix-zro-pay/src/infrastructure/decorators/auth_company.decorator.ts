import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  NotImplementedException,
  NullPointerException,
  ProtocolType,
} from '@zro/common';
import { AuthCompany } from '@zro/pix-zro-pay/domain';

/**
 * Get request auth company.
 */
export const AuthCompanyParam = createParamDecorator(
  (Class: any, context: ExecutionContext): AuthCompany => {
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

    if (!request.company) {
      throw new NullPointerException(
        'Request company is not defined. Check if JwtAuthGuard is available.',
      );
    }

    return request.company;
  },
);
