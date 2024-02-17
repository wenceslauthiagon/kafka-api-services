import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  NotImplementedException,
  NullPointerException,
  ProtocolType,
} from '@zro/common';
import { SmtpGateway } from '@zro/notifications/application';

/**
 * Create a child logger with request logger ID.
 */
export const MatracaDecorator = createParamDecorator(
  (Class: any, context: ExecutionContext): SmtpGateway => {
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

    if (!request.matracaGateway) {
      throw new NullPointerException(
        'Request SmtpGateway is not defined. Check if MatracaGateWayIntercept is available.',
      );
    }

    return request.matracaGateway;
  },
);
