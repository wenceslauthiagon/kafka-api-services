import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  NotImplementedException,
  NullPointerException,
  ProtocolType,
} from '@zro/common';
import { IssuePixFraudDetectionGateway } from '@zro/pix-payments/application';

/**
 * Get the JiraPixFraudDetectionGateway from request.
 */
export const JiraPixFraudDetectionGatewayParam = createParamDecorator(
  (Class: any, context: ExecutionContext): IssuePixFraudDetectionGateway => {
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

    if (!request.jiraPixFraudDetectionGateway) {
      throw new NullPointerException(
        'Request jiraPixFraudDetectionGateway is not defined. Check if JiraPixFraudDetectionInterceptor is available.',
      );
    }

    return request.jiraPixFraudDetectionGateway;
  },
);
