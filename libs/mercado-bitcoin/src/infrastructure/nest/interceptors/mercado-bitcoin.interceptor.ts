import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import {
  NotImplementedException,
  NullPointerException,
  ProtocolType,
} from '@zro/common';
import { MercadoBitcoinCryptoRemittanceService } from '../services/crypto_remittance.service';
import { MercadoBitcoinHistoricalCryptoPriceService } from '../services/historical_crypto_price.service';

@Injectable()
export class MercadoBitcoinCryptoRemittanceInterceptor
  implements NestInterceptor
{
  /**
   * Default constructor.
   * @param service Global MercadoBitcoinConversionService instance.
   */
  constructor(private service: MercadoBitcoinCryptoRemittanceService) {}

  /**
   * Intercept request and add a MercadoBitcoinConversionInfractionGateway.
   * @param context Execution context.
   * @param next Next function.
   * @returns Execution pipeline.
   */
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
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

    if (!request.logger) {
      throw new NullPointerException(
        'Request logger is not defined. Check if LoggerInterceptor is available.',
      );
    }

    request.mercadoBitcoinCryptoRemittanceGateway =
      this.service.getMercadoBitcoinCryptoRemittanceGateway(request.logger);

    return next.handle();
  }
}

@Injectable()
export class MercadoBitcoinHistoricalCryptoPriceInterceptor
  implements NestInterceptor
{
  /**
   * Default constructor.
   * @param service Global MercadoBitcoinConversionService instance.
   */
  constructor(private service: MercadoBitcoinHistoricalCryptoPriceService) {}

  /**
   * Intercept request and add a MercadoBitcoinConversionInfractionGateway.
   * @param context Execution context.
   * @param next Next function.
   * @returns Execution pipeline.
   */
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
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

    if (!request.logger) {
      throw new NullPointerException(
        'Request logger is not defined. Check if LoggerInterceptor is available.',
      );
    }

    request.mercadoBitcoinHistoricalCryptoPriceGateway =
      this.service.getMercadoBitcoinHistoricalCryptoPriceGateway(
        request.logger,
      );

    return next.handle();
  }
}
