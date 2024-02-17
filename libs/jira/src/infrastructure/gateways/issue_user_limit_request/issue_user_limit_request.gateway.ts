import { Logger } from 'winston';
import * as JiraApi from 'jira-client';
import {
  CreateUserLimitRequestPspRequest,
  UserLimitRequestGateway,
} from '@zro/compliance/application';
import { JiraCreateUserLimitRequestGateway } from './create_user_limit_request.gateway';

export class JiraIssueUserLimitRequestGateway
  implements UserLimitRequestGateway
{
  constructor(
    private readonly logger: Logger,
    private readonly jiraPixRefund: JiraApi,

    private readonly userLimitRequestReporterId: string,
    private readonly userLimitRequestProjectId: string,
    private readonly userLimitRequestIssueTypeId: string,

    private readonly customFieldUserLimitRequestId: string,
    private readonly customFieldUserLimitRequestUserId: string,
    private readonly customFieldUserLimitRequestUserLimitId: string,
    private readonly customFieldUserLimitRequestYearlyLimit: string,
    private readonly customFieldUserLimitRequestMonthlyLimit: string,
    private readonly customFieldUserLimitRequestDailyLimit: string,
    private readonly customFieldUserLimitRequestNightlyLimit: string,
    private readonly customFieldUserLimitRequestMaxAmount: string,
    private readonly customFieldUserLimitRequestMinAmount: string,
    private readonly customFieldUserLimitRequestMaxAmountNightly: string,
    private readonly customFieldUserLimitRequestMinAmountNightly: string,
  ) {
    this.logger = logger.child({
      context: JiraIssueUserLimitRequestGateway.name,
    });
  }

  async createUserLimitRequest(
    request: CreateUserLimitRequestPspRequest,
  ): Promise<void> {
    this.logger.debug('Create issue user limit request.', { request });

    const gateway = new JiraCreateUserLimitRequestGateway(
      this.logger,
      this.jiraPixRefund,

      this.userLimitRequestReporterId,
      this.userLimitRequestProjectId,
      this.userLimitRequestIssueTypeId,
      this.customFieldUserLimitRequestId,
      this.customFieldUserLimitRequestUserId,
      this.customFieldUserLimitRequestUserLimitId,
      this.customFieldUserLimitRequestYearlyLimit,
      this.customFieldUserLimitRequestMonthlyLimit,
      this.customFieldUserLimitRequestDailyLimit,
      this.customFieldUserLimitRequestNightlyLimit,
      this.customFieldUserLimitRequestMaxAmount,
      this.customFieldUserLimitRequestMinAmount,
      this.customFieldUserLimitRequestMaxAmountNightly,
      this.customFieldUserLimitRequestMinAmountNightly,
    );

    await gateway.createUserLimitRequest(request);
  }
}
