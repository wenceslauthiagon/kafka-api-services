import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  NotImplementedException,
  NullPointerException,
  ProtocolType,
} from '@zro/common';
import { SmsGateway } from '@zro/notifications/application';

/**
 * Get the BulksmsIntercept from request.
 */
export const BulksmsDecorator = createParamDecorator(
  (Class: any, context: ExecutionContext): SmsGateway => {
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

    if (!request.bulksmsGateway) {
      throw new NullPointerException(
        'Request SmsGateWay is not defined. Check if BulksmsIntercept is available.',
      );
    }

    return request.bulksmsGateway;
  },
);
