import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  NotImplementedException,
  NullPointerException,
  ProtocolType,
} from '@zro/common';
import { WebhookTargetGateway } from '@zro/webhooks/application';

/**
 * Get the AxiosWebhookTargetGatewayParam from request.
 */
export const AxiosWebhookTargetGatewayParam = createParamDecorator(
  (Class: any, context: ExecutionContext): WebhookTargetGateway => {
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

    if (!request.axiosWebhookTargetGateway) {
      throw new NullPointerException(
        'Request axiosWebhookTargetGateway is not defined. Check if AxiosWebhookTargetGatewayInterceptor is available.',
      );
    }

    return request.axiosWebhookTargetGateway;
  },
);
