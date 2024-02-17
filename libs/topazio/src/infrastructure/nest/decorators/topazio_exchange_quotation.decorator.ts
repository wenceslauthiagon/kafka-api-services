import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  NotImplementedException,
  NullPointerException,
  ProtocolType,
} from '@zro/common';
import { ExchangeQuotationGateway } from '@zro/otc/application';

/**
 * Get the TopazioExchangeQuotationGateway from request.
 */
export const TopazioExchangeQuotationGatewayParam = createParamDecorator(
  (Class: any, context: ExecutionContext): ExchangeQuotationGateway => {
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

    if (!request.topazioExchangeQuotationGateway) {
      throw new NullPointerException(
        'Request topazioExchangeQuotationGateway is not defined. Check if TopazioExchangeQuotationInterceptor is available.',
      );
    }

    return request.topazioExchangeQuotationGateway;
  },
);
