import { Logger } from 'winston';
import * as JiraApi from 'jira-client';
import {
  WarningTransactionGateway,
  CreateWarningTransactionRequest,
  CreateWarningTransactionResponse,
  UpdateWarningTransactionStatusToClosedIssueRequest,
} from '@zro/compliance/application';
import {
  IssueWarningTransactionGateway,
  AddWarningTransactionCommentRequest,
} from '@zro/pix-payments/application';
import {
  JiraCreateWarningTransactionGateway,
  JiraUpdateWarningTransactionStatusToClosedGateway,
  JiraUpdateWarningTransactionGateway,
} from '@zro/jira/infrastructure';

export class JiraWarningTransactionGateway
  implements WarningTransactionGateway, IssueWarningTransactionGateway
{
  constructor(
    private readonly logger: Logger,
    private readonly jiraWarningTransaction: JiraApi,
    private readonly warningTransactionProjectId: string,
    private readonly warningTransactionReporterId: string,
    private readonly warningTransactionIssueTypeId: string,

    private readonly customFieldWarningTransactionOperationId: string,
    private readonly customFieldWarningTransactionTransactionTag: string,
    private readonly customFieldWarningTransactionEndToEndId: string,
    private readonly customFieldWarningTransactionReason: string,

    private readonly customFieldWarningTransactionStatusNew: string,
    private readonly customFieldWarningTransactionStatusClosed: string,
    private readonly customFieldWarningTransactionStatusInAnalysis: string,
    private readonly customFieldWarningTransactionTransitionClose: string,
    private readonly customFieldWarningTransactionTransitionInAnalysis: string,
  ) {
    this.logger = logger.child({ context: JiraWarningTransactionGateway.name });
  }

  async createWarningTransaction(
    request: CreateWarningTransactionRequest,
  ): Promise<CreateWarningTransactionResponse> {
    this.logger.debug('Create warning transaction request.', { request });

    const gateway = new JiraCreateWarningTransactionGateway(
      this.logger,
      this.jiraWarningTransaction,
      this.warningTransactionProjectId,
      this.warningTransactionIssueTypeId,
      this.customFieldWarningTransactionOperationId,
      this.customFieldWarningTransactionTransactionTag,
      this.customFieldWarningTransactionEndToEndId,
      this.customFieldWarningTransactionReason,
    );

    return gateway.createWarningTransaction(request);
  }

  async updateWarningTransactionStatusToClosed(
    request: UpdateWarningTransactionStatusToClosedIssueRequest,
  ): Promise<void> {
    this.logger.debug('Update warning transaction status to closed request.', {
      request,
    });

    const gateway = new JiraUpdateWarningTransactionStatusToClosedGateway(
      this.logger,
      this.jiraWarningTransaction,
      this.customFieldWarningTransactionStatusNew,
      this.customFieldWarningTransactionStatusClosed,
      this.customFieldWarningTransactionStatusInAnalysis,
      this.customFieldWarningTransactionTransitionClose,
      this.customFieldWarningTransactionTransitionInAnalysis,
    );

    return gateway.updateWarningTransactionStatusToClosed(request);
  }

  async addWarningTransactionComment(
    request: AddWarningTransactionCommentRequest,
  ): Promise<void> {
    this.logger.debug('Add warning transaction comment request.', {
      request,
    });

    const gateway = new JiraUpdateWarningTransactionGateway(
      this.logger,
      this.jiraWarningTransaction,
    );

    return gateway.addWarningTransactionComment(request);
  }
}
