import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  NotImplementedException,
  NullPointerException,
  ProtocolType,
} from '@zro/common';
import { BankingTedGateway } from '@zro/banking/application';

/**
 * Get the TopazioBankingTedGateway from request.
 */
export const TopazioBankingTedGatewayParam = createParamDecorator(
  (Class: any, context: ExecutionContext): BankingTedGateway => {
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

    if (!request.topazioBankingTedGateway) {
      throw new NullPointerException(
        'Request topazioBankingTedGateway is not defined. Check if TopazioBankingTedInterceptor is available.',
      );
    }

    return request.topazioBankingTedGateway;
  },
);
