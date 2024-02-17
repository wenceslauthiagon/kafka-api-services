import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  NotImplementedException,
  NullPointerException,
  ProtocolType,
} from '@zro/common';
import { IssueInfractionGateway } from '@zro/pix-payments/application';

/**
 * Get the JiraPixInfractionGateway from request.
 */
export const JiraPixInfractionGatewayParam = createParamDecorator(
  (Class: any, context: ExecutionContext): IssueInfractionGateway => {
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

    if (!request.jiraPixInfractionGateway) {
      throw new NullPointerException(
        'Request jiraPixInfractionGateway is not defined. Check if JiraPixInfractionInterceptor is available.',
      );
    }

    return request.jiraPixInfractionGateway;
  },
);
