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
import { AxiosWebhookTargetGatewayService } from '../providers/axios_webhook_target_gateway.service';

@Injectable()
export class AxiosWebhookTargetGatewayInterceptor implements NestInterceptor {
  /**
   * Default constructor.
   * @param service Global AxiosWebhookTargetGatewayService instance.
   */
  constructor(private service: AxiosWebhookTargetGatewayService) {}

  /**
   * Intercept request and add a AxiosWebhookTargetGatewayService.
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

    request.axiosWebhookTargetGateway = this.service.getWebhookTargetGateway(
      request.logger,
    );

    return next.handle();
  }
}
