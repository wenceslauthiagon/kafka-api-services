import { v4 as uuidV4 } from 'uuid';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { KafkaContext } from '@nestjs/microservices';
import { ProtocolType } from '../helpers/protocol.helper';
import { NotImplementedException } from '../exceptions/not_implemented.exception';

/**
 * Create a child logger with request logger ID.
 */
export const RequestId = createParamDecorator(
  (data: any, context: ExecutionContext): string => {
    let requestId = uuidV4();

    const protocol = context.getType();
    if (protocol === ProtocolType.HTTP) {
      const ctx = context.switchToHttp();
      const request = ctx.getRequest();
      requestId = request.id ?? requestId;
    } else if (protocol === ProtocolType.RPC) {
      const ctx = context.switchToRpc();
      const request = ctx.getContext<KafkaContext>();
      requestId =
        request.getMessage().headers?.requestId?.toString() ?? requestId;
    } else {
      throw new NotImplementedException(
        `Protocol ${protocol} is not implemented.`,
      );
    }

    return requestId;
  },
);
