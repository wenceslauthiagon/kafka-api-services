import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  NotImplementedException,
  NullPointerException,
  ProtocolType,
} from '@zro/common';
import { CryptoRemittanceGateway } from '@zro/otc/application';

/**
 * Get the B2C2CryptoRemittanceIntercept from request.
 */
export const B2C2CryptoRemittanceDecorator = createParamDecorator(
  (Class: any, context: ExecutionContext): CryptoRemittanceGateway => {
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

    if (!request.b2c2ConversionGateway) {
      throw new NullPointerException(
        'Request b2c2ConversionGateway is not defined. Check if B2C2ConversionIntercept is available.',
      );
    }

    return request.b2c2ConversionGateway;
  },
);
