import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  NotImplementedException,
  NullPointerException,
  ProtocolType,
} from '@zro/common';
import { IssueRefundGateway } from '@zro/pix-payments/application';

/**
 * Get the JiraIssueRefundGateway from request.
 */
export const JiraIssueRefundGatewayParam = createParamDecorator(
  (Class: any, context: ExecutionContext): IssueRefundGateway => {
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

    if (!request.jiraIssueRefundGateway) {
      throw new NullPointerException(
        'Request jiraIssueRefundGateway is not defined. Check if JiraIssueRefundInterceptor is available.',
      );
    }

    return request.jiraIssueRefundGateway;
  },
);
