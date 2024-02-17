import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  NotImplementedException,
  NullPointerException,
  ProtocolType,
} from '@zro/common';
import { ReportGateway } from '@zro/reports/application';

/**
 * Get the EguardianReportGateway from request.
 */
export const EguardianReportGatewayParam = createParamDecorator(
  (Class: any, context: ExecutionContext): ReportGateway => {
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

    if (!request.reportGateway) {
      throw new NullPointerException(
        'Request EguardianReportGateway not defined. Check if EguardianReportInterceptor is available.',
      );
    }

    return request.reportUserGateway;
  },
);
