import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  NotImplementedException,
  NullPointerException,
  ProtocolType,
} from '@zro/common';
import { PixRefundGateway } from '@zro/pix-payments/application';

/**
 * Get the JdpiPixRefundGateway from request.
 */
export const JdpiPixRefundGatewayParam = createParamDecorator(
  (Class: any, context: ExecutionContext): PixRefundGateway => {
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

    if (!request.jdpiPixRefundGateway) {
      throw new NullPointerException(
        'Request jdpiPixRefundGateway is not defined. Check if JdpiPixRefundInterceptor is available.',
      );
    }

    return request.jdpiPixRefundGateway;
  },
);
