import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import { InjectLogger } from '../modules';
import { ProtocolType } from '../helpers/protocol.helper';
import { NotImplementedException } from '../exceptions/not_implemented.exception';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   */
  constructor(@InjectLogger() private readonly logger: Logger) {
    this.logger = logger.child({ context: LoggerInterceptor.name });
  }

  /**
   * Intercept request and add a logger.
   * @param context Execution context.
   * @param next Next function.
   * @returns Execution pipeline.
   */
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    let request: any = null;
    let requestId: string = uuidV4();

    const protocol = context.getType();
    if (protocol === ProtocolType.HTTP) {
      const ctx = context.switchToHttp();
      request = ctx.getRequest();
      requestId = request.id ?? requestId;
    } else if (protocol === ProtocolType.RPC) {
      const ctx = context.switchToRpc();
      request = ctx.getContext();
      requestId =
        request.getMessage?.().headers?.requestId?.toString() ?? requestId;
    } else {
      throw new NotImplementedException(
        `Protocol ${protocol} is not implemented.`,
      );
    }

    request.logger = this.logger.child({ loggerId: requestId });

    return next.handle();
  }
}
