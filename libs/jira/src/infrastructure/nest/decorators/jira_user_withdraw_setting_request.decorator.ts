import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  NotImplementedException,
  NullPointerException,
  ProtocolType,
} from '@zro/common';
import { UserWithdrawSettingRequestGateway } from '@zro/compliance/application';

/**
 * Get the JiraUserWithdrawSettingRequestGateway from request.
 */
export const JiraUserWithdrawSettingRequestGatewayParam = createParamDecorator(
  (
    Class: any,
    context: ExecutionContext,
  ): UserWithdrawSettingRequestGateway => {
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

    if (!request.jiraUserWithdrawSettingRequestGateway) {
      throw new NullPointerException(
        'Request jiraUserWithdrawSettingRequestGateway is not defined. Check if JiraUserWithdrawSettingRequestInterceptor is available.',
      );
    }

    return request.jiraUserWithdrawSettingRequestGateway;
  },
);
