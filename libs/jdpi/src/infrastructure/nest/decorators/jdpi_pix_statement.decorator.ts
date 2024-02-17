import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  NotImplementedException,
  NullPointerException,
  ProtocolType,
} from '@zro/common';
import { PixStatementGateway } from '@zro/api-jdpi/application';

/**
 * Get the JdpiPixStatementGateway from request.
 */
export const JdpiPixStatementGatewayParam = createParamDecorator(
  (Class: any, context: ExecutionContext): PixStatementGateway => {
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

    if (!request.jdpiPixStatementGateway) {
      throw new NullPointerException(
        'Request jdpiPixStatementGateway is not defined. Check if JdpiPixStatementInterceptor is available.',
      );
    }

    return request.jdpiPixStatementGateway;
  },
);
