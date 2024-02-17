import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  NotImplementedException,
  NullPointerException,
  ProtocolType,
} from '@zro/common';
import { BankGateway } from '@zro/banking/application';

/**
 * Get the JdpiBankGateway from request.
 */
export const JdpiBankGatewayParam = createParamDecorator(
  (Class: any, context: ExecutionContext): BankGateway => {
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

    if (!request.jdpiBankGateway) {
      throw new NullPointerException(
        'Request jdpiBankGateway is not defined. Check if JdpiBankInterceptor is available.',
      );
    }

    return request.jdpiBankGateway;
  },
);
