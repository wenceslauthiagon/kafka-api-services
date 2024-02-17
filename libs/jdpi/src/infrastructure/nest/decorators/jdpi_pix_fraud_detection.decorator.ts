import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  NotImplementedException,
  NullPointerException,
  ProtocolType,
} from '@zro/common';
import { PixFraudDetectionGateway } from '@zro/pix-payments/application';

/**
 * Get the JdpiPixFraudDetectionGateway from request.
 */
export const JdpiPixFraudDetectionGatewayParam = createParamDecorator(
  (Class: any, context: ExecutionContext): PixFraudDetectionGateway => {
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

    if (!request.jdpiPixFraudDetectionGateway) {
      throw new NullPointerException(
        'Request jdpiPixFraudDetectionGateway is not defined. Check if JdpiPixFraudDetectionInterceptor is available.',
      );
    }

    return request.jdpiPixFraudDetectionGateway;
  },
);
