import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  NotImplementedException,
  NullPointerException,
  ProtocolType,
} from '@zro/common';
import { PixPaymentGateway } from '@zro/pix-payments/application';

/**
 * Get the JdpiPixPaymentGateway from request.
 */
export const JdpiPixPaymentGatewayParam = createParamDecorator(
  (Class: any, context: ExecutionContext): PixPaymentGateway => {
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

    if (!request.jdpiPixPaymentGateway) {
      throw new NullPointerException(
        'Request jdpiPixPaymentGateway is not defined. Check if JdpiPixPaymentInterceptor is available.',
      );
    }

    return request.jdpiPixPaymentGateway;
  },
);
