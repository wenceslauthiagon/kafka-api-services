import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import {
  NotImplementedException,
  NullPointerException,
  ProtocolType,
} from '@zro/common';
import { JiraComplianceService } from '../providers/jira_compliance.service';

@Injectable()
export class JiraWarningTransactionInterceptor implements NestInterceptor {
  /**
   * Default constructor.
   * @param service Global JiraPixService instance.
   */
  constructor(private service: JiraComplianceService) {}

  /**
   * Intercept request and add a JiraWarningTransactionGateway.
   * @param context Execution context.
   * @param next Next function.
   * @returns Execution pipeline.
   */
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
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

    if (!request.logger) {
      throw new NullPointerException(
        'Request logger is not defined. Check if LoggerInterceptor is available.',
      );
    }

    request.jiraWarningTransactionGateway =
      this.service.getWarningTransactionGateway(request.logger);

    return next.handle();
  }
}
