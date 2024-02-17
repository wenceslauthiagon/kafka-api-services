import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  NotImplementedException,
  NullPointerException,
  ProtocolType,
} from '@zro/common';
import { PixKeyGateway } from '@zro/pix-keys/application';

/**
 * Get the JdpiPixKeyGateway from request.
 */
export const JdpiPixKeyGatewayParam = createParamDecorator(
  (Class: any, context: ExecutionContext): PixKeyGateway => {
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

    if (!request.jdpiPixKeyGateway) {
      throw new NullPointerException(
        'Request jdpiPixKeyGateway is not defined. Check if JdpiPixKeyInterceptor is available.',
      );
    }

    return request.jdpiPixKeyGateway;
  },
);
