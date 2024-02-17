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
import { B2C2CryptoRemittanceService } from '../providers/crypto_remittance.service';

@Injectable()
export class B2C2CryptoRemittanceInterceptor implements NestInterceptor {
  /**
   * Default constructor.
   * @param service Global B2C2ConversionService instance.
   */
  constructor(private service: B2C2CryptoRemittanceService) {}

  /**
   * Intercept request and add a B2C2ConversionInfractionGateway.
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

    request.b2c2ConversionGateway = this.service.getB2C2CryptoRemittanceGateway(
      request.logger,
    );

    return next.handle();
  }
}
