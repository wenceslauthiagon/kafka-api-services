import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  NotImplementedException,
  NullPointerException,
  ProtocolType,
} from '@zro/common';
import { IssueInfractionGateway } from '@zro/pix-payments/application';

/**
 * Get the JiraWarningTransactionGateway from request.
 */
export const JiraWarningTransactionGatewayParam = createParamDecorator(
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

    if (!request.jiraWarningTransactionGateway) {
      throw new NullPointerException(
        'Request jiraWarningTransactionGateway is not defined. Check if JiraWarningTransactionInterceptor is available.',
      );
    }

    return request.jiraWarningTransactionGateway;
  },
);
