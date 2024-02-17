import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ProtocolType } from '../helpers/protocol.helper';
import { NotImplementedException } from '../exceptions/not_implemented.exception';
import { NullPointerException } from '../exceptions';

/**
 * Get bug report session.
 */
export const BugReportSessionParam = createParamDecorator(
  (data: any, context: ExecutionContext): string => {
    let request: any = null;

    const protocol = context.getType();
    if (protocol === ProtocolType.HTTP) {
      const ctx = context.switchToHttp();
      request = ctx.getRequest();
    } else {
      throw new NotImplementedException(
        `Protocol ${protocol} is not implemented.`,
      );
    }

    const { bugReportSession } = request;

    if (!bugReportSession) {
      throw new NullPointerException(
        `Bug report session are not defined.
        Check if BugReportInterceptor is available.`,
      );
    }

    return bugReportSession;
  },
);
