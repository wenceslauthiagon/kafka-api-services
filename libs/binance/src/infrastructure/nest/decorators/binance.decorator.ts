import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  NotImplementedException,
  NullPointerException,
  ProtocolType,
} from '@zro/common';
import { CryptoRemittanceGateway } from '@zro/otc/application';

/**
 * Get the BinanceCryptoRemittanceIntercept from request.
 */
export const BinanceCryptoRemittanceDecorator = createParamDecorator(
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

    if (!request.binanceCryptoRemittanceGateway) {
      throw new NullPointerException(
        'Request binanceCryptoRemittanceGateway is not defined. Check if BinanceCryptoRemittanceIntercept is available.',
      );
    }

    return request.binanceCryptoRemittanceGateway;
  },
);
