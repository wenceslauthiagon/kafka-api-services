import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  NotImplementedException,
  NullPointerException,
  ProtocolType,
} from '@zro/common';
import { SmsGateway } from '@zro/notifications/application';

/**
 * Get the DockIntercept from request.
 */
export const DockDecorator = createParamDecorator(
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

    if (!request.dockGateway) {
      throw new NullPointerException(
        'Request SmsGateWay is not defined. Check if DockIntercept is available.',
      );
    }

    return request.dockGateway;
  },
);
