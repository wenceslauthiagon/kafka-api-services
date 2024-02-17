import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { v4 as uuidV4 } from 'uuid';
import { ProtocolType } from '../helpers/protocol.helper';
import { NotImplementedException } from '../exceptions/not_implemented.exception';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
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
    const protocol = context.getType();
    if (protocol === ProtocolType.HTTP) {
      const ctx = context.switchToHttp();
      const request = ctx.getRequest();
      request.id = request?.id ?? uuidV4();
    } else if (protocol === ProtocolType.RPC) {
      const ctx = context.switchToRpc();
      const request = ctx.getContext();
      request.id =
        request.getMessage?.().headers?.requestId?.toString() ?? uuidV4();
    } else {
      throw new NotImplementedException(
        `Protocol ${protocol} is not implemented.`,
      );
    }

    return next.handle();
  }
}
