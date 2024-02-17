import { Logger } from 'winston';
import * as JiraApi from 'jira-client';
import {
  IssueRefundGateway,
  CreateRefundIssueRequest,
  CreateRefundIssueResponse,
  CancelRefundIssueRequest,
  CancelRefundIssueResponse,
  CloseRefundIssueRequest,
  CloseRefundIssueResponse,
  UpdateRefundStatusIssueRefundRequest,
} from '@zro/pix-payments/application';
import { JiraCreateRefundGateway } from './create_refund.gateway';
import { JiraCancelRefundGateway } from './cancel_refund.gateway';
import { JiraCloseRefundGateway } from './close_refund.gateway';
import { JiraUpdateRefundStatusGateway } from './update_refund_status.gateway';

export class JiraIssueRefundGateway implements IssueRefundGateway {
  constructor(
    private readonly logger: Logger,
    private readonly jiraPixRefund: JiraApi,

    private readonly refundProjectId: string,
    private readonly refundIssueTypeId: string,
    private readonly refundReporterId: string,

    private readonly customFieldRefundEndToEndId: string,
    private readonly customFieldRefundAmount: string,
    private readonly customFieldRefundOperationId: string,

    private readonly customFieldRefundCancelledStatus: string,
    private readonly customFieldRefundClosedStatus: string,
    private readonly customFieldRefundReceivedStatus: string,

    private readonly customFieldRefundRejectionReason: string,
    private readonly customFieldRefundRejectionAccountClosureReason: string,
    private readonly customFieldRefundRejectionCannotRefundReason: string,
    private readonly customFieldRefundRejectionNoBalanceReason: string,
    private readonly customFieldRefundRejectionOtherReason: string,

    private readonly customFieldRefundSolicitationPspId: string,
    private readonly customFieldRefundDevolutionEndToEndId: string,
    private readonly customFieldRefundAnalisysDetails: string,

    private readonly customFieldRefundReason: string,
    private readonly customFieldRefundFraudReason: string,
    private readonly customFieldRefundOperationFlawReason: string,
    private readonly customFieldRefundCancelledReason: string,
  ) {
    this.logger = logger.child({ context: JiraIssueRefundGateway.name });
  }

  async createRefund(
    request: CreateRefundIssueRequest,
  ): Promise<CreateRefundIssueResponse> {
    this.logger.debug('Create refund request.', { request });

    const gateway = new JiraCreateRefundGateway(
      this.logger,
      this.jiraPixRefund,
      this.refundProjectId,
      this.refundIssueTypeId,
      this.customFieldRefundEndToEndId,
      this.customFieldRefundAmount,
      this.customFieldRefundReason,
      this.customFieldRefundFraudReason,
      this.customFieldRefundOperationFlawReason,
      this.customFieldRefundCancelledReason,
      this.customFieldRefundOperationId,
    );

    return gateway.createRefund(request);
  }

  async cancelRefund(
    request: CancelRefundIssueRequest,
  ): Promise<CancelRefundIssueResponse> {
    this.logger.debug('Cancel refund request.', { request });

    const gateway = new JiraCancelRefundGateway(
      this.logger,
      this.jiraPixRefund,
      this.refundProjectId,
      this.refundReporterId,
      this.customFieldRefundRejectionReason,
      this.customFieldRefundRejectionAccountClosureReason,
      this.customFieldRefundRejectionCannotRefundReason,
      this.customFieldRefundRejectionNoBalanceReason,
      this.customFieldRefundRejectionOtherReason,
      this.customFieldRefundSolicitationPspId,
      this.customFieldRefundDevolutionEndToEndId,
      this.customFieldRefundAnalisysDetails,
    );

    return gateway.cancelRefund(request);
  }

  async closeRefund(
    request: CloseRefundIssueRequest,
  ): Promise<CloseRefundIssueResponse> {
    this.logger.debug('Close refund request.', { request });

    const gateway = new JiraCloseRefundGateway(
      this.logger,
      this.jiraPixRefund,
      this.refundProjectId,
      this.refundReporterId,
      this.customFieldRefundSolicitationPspId,
      this.customFieldRefundReason,
      this.customFieldRefundFraudReason,
      this.customFieldRefundOperationFlawReason,
      this.customFieldRefundCancelledReason,
    );

    return gateway.closeRefund(request);
  }

  async updateRefundStatus(
    request: UpdateRefundStatusIssueRefundRequest,
  ): Promise<void> {
    this.logger.debug('Update refund status request.', { request });

    const gateway = new JiraUpdateRefundStatusGateway(
      this.logger,
      this.jiraPixRefund,
      this.customFieldRefundCancelledStatus,
      this.customFieldRefundClosedStatus,
      this.customFieldRefundReceivedStatus,
    );

    return gateway.updateRefundStatus(request);
  }
}
