import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  NotImplementedException,
  NullPointerException,
  ProtocolType,
} from '@zro/common';
import { KycGateway } from '@zro/pix-payments/application';

/**
 * Get the TopazioKycGateway from request.
 */
export const TopazioKycGatewayParam = createParamDecorator(
  (Class: any, context: ExecutionContext): KycGateway => {
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

    if (!request.topazioKycGateway) {
      throw new NullPointerException(
        'Request topazioKycGateway is not defined. Check if TopazioKycInterceptor is available.',
      );
    }

    return request.topazioKycGateway;
  },
);
