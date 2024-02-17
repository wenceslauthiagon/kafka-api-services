import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  NotImplementedException,
  NullPointerException,
  ProtocolType,
} from '@zro/common';
import { PixInfractionGateway } from '@zro/pix-payments/application';

/**
 * Get the JdpiPixInfractionGateway from request.
 */
export const JdpiPixInfractionGatewayParam = createParamDecorator(
  (Class: any, context: ExecutionContext): PixInfractionGateway => {
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

    if (!request.jdpiPixInfractionGateway) {
      throw new NullPointerException(
        'Request jdpiPixInfractionGateway is not defined. Check if JdpiPixInfractionInterceptor is available.',
      );
    }

    return request.jdpiPixInfractionGateway;
  },
);
