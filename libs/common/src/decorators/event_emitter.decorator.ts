import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { NotImplementedException } from '../exceptions/not_implemented.exception';
import { NullPointerException } from '../exceptions/null_pointer.exception';
import { DefaultEventEmitter } from '../helpers/event.helper';
import { ProtocolType } from '../helpers/protocol.helper';

/**
 * Get kafka event emitter.
 */
export const EventEmitterParam = createParamDecorator(
  (EventEmitter: any, context: ExecutionContext): DefaultEventEmitter => {
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

    const { id, emitter, logger } = request;

    if (!id || !emitter || !logger) {
      throw new NullPointerException(
        `Request id, logger, or emitter are not defined.
        Check if RequestIdInterceptor, LoggerInterceptor, or *KafkaEventInterceptor are available.`,
      );
    }

    return new EventEmitter(id, emitter, logger);
  },
);
