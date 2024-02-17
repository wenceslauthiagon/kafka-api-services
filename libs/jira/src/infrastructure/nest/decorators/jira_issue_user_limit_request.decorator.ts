import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  NotImplementedException,
  NullPointerException,
  ProtocolType,
} from '@zro/common';
import { UserLimitRequestGateway } from '@zro/compliance/application';

/**
 * Get the JiraIssueRefundGateway from request.
 */
export const JiraIssueUserLimitRequestGatewayParam = createParamDecorator(
  (Class: any, context: ExecutionContext): UserLimitRequestGateway => {
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

    if (!request.jiraIssueUserLimitRequestGateway) {
      throw new NullPointerException(
        'Request jiraIssueUserLimitRequestGateway is not defined. Check if JiraIssueUserLimitRequestInterceptor is available.',
      );
    }

    return request.jiraIssueUserLimitRequestGateway;
  },
);
