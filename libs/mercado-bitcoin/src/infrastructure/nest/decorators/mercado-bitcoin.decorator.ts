import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  NotImplementedException,
  NullPointerException,
  ProtocolType,
} from '@zro/common';
import { CryptoRemittanceGateway } from '@zro/otc/application';

/**
 * Get the MercadoBitcoinConversionIntercept from request.
 */
export const MercadoBitcoinCryptoRemittanceDecorator = createParamDecorator(
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

    if (!request.mercadoBitcoinCryptoRemittanceGateway) {
      throw new NullPointerException(
        'Request mercadoBitcoinCryptoRemittanceGateway is not defined. Check if MercadoBitcoinCryptoRemittanceIntercept is available.',
      );
    }

    return request.mercadoBitcoinCryptoRemittanceGateway;
  },
);

/**
 * Get the MercadoBitcoinHistoricalPriceIntercept from request.
 */
export const MercadoBitcoinHistoricalCryptoPriceParam = createParamDecorator(
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

    if (!request.mercadoBitcoinHistoricalCryptoPriceGateway) {
      throw new NullPointerException(
        'Request mercadoBitcoinHistoricalCryptoPriceGateway is not defined. Check if MercadoBitcoinHistoricalCryptoPriceIntercept is available.',
      );
    }

    return request.mercadoBitcoinHistoricalCryptoPriceGateway;
  },
);
