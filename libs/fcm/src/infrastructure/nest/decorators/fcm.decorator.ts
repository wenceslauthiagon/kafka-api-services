import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PushNotificationGateway } from '@zro/notifications/application';
import {
  NotImplementedException,
  NullPointerException,
  ProtocolType,
} from '@zro/common';

/**
 * Create a child logger with request logger ID.
 */
export const FcmDecorator = createParamDecorator(
  (Class: any, context: ExecutionContext): PushNotificationGateway => {
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

    if (!request.fcmGateway) {
      throw new NullPointerException(
        'Request PushNotificationGateway is not defined. Check if FcmGateWayInterceptor is available.',
      );
    }

    return request.fcmGateway;
  },
);
