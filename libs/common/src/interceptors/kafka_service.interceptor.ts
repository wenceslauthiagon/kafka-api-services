import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { KafkaContext } from '@nestjs/microservices';
import { KafkaService } from '../modules/kafka.module';
import { NotImplementedException } from '../exceptions/not_implemented.exception';
import { ProtocolType } from '../helpers/protocol.helper';

/**
 * Intercepts kafkaService and send it to controller.
 */
@Injectable()
export class KafkaServiceInterceptor implements NestInterceptor {
  constructor(private kafkaService: KafkaService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    // Get request.
    let request: any = null;

    const protocol = context.getType();
    if (protocol === ProtocolType.HTTP) {
      const ctx = context.switchToHttp();
      request = ctx.getRequest();
    } else if (protocol === ProtocolType.RPC) {
      const ctx = context.switchToRpc();
      request = ctx.getContext<KafkaContext>();
    } else {
      throw new NotImplementedException(
        `Protocol ${protocol} is not implemented.`,
      );
    }

    // Store kafkaService to be used by nest controllers.
    request.kafkaService = this.kafkaService;

    if (protocol === ProtocolType.HTTP) {
      return next.handle();
    }

    // Only handle to ProtocolType.RPC.
    return next.handle().pipe(
      // Did execute successfully and return data?
      map((data) => {
        const { headers, key } = request.getMessage();
        return { headers, key, value: data?.value };
      }),
    );
  }
}
