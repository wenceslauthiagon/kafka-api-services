import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  NotImplementedException,
  NullPointerException,
  ProtocolType,
} from '@zro/common';
import { StorageGateway } from '@zro/storage/application';

/**
 * Get the StorageGateway from request.
 */
export const StorageGatewayParam = createParamDecorator(
  (Class: any, context: ExecutionContext): StorageGateway => {
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

    if (!request.storageGateway) {
      throw new NullPointerException(
        'Request StorageGateway not defined. Check if StorageInterceptor is available.',
      );
    }

    return request.storageGateway;
  },
);
