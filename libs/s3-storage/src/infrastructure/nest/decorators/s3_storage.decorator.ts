import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  NotImplementedException,
  NullPointerException,
  ProtocolType,
} from '@zro/common';
import { StorageGateway } from '@zro/storage/application';

/**
 * Get the S3StorageGateway from request.
 */
export const S3StorageGatewayParam = createParamDecorator(
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

    if (!request.s3StorageGateway) {
      throw new NullPointerException(
        'Request s3StorageGateway is not defined. Check if S3StorageInterceptor is available.',
      );
    }

    return request.s3StorageGateway;
  },
);
