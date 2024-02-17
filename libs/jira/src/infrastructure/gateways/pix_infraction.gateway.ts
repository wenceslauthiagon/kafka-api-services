import { Logger } from 'winston';
import * as JiraApi from 'jira-client';
import {
  IssueInfractionGateway,
  CreateInfractionIssueInfractionRequest,
  CreateInfractionIssueInfractionResponse,
  UpdateInfractionIssueInfractionRequest,
  UpdateInfractionStatusIssueInfractionRequest,
} from '@zro/pix-payments/application';
import {
  JiraCreateInfractionGateway,
  JiraUpdateInfractionGateway,
  JiraUpdateInfractionStatusGateway,
} from '@zro/jira/infrastructure';

export class JiraPixInfractionGateway implements IssueInfractionGateway {
  constructor(
    private readonly logger: Logger,
    private readonly jiraPixInfraction: JiraApi,
    private readonly infractionProjectId: string,
    private readonly infractionReporterId: string,
    private readonly infractionIssueTypeId: string,

    private readonly customFieldInfractionOperationId: string,
    private readonly customFieldInfractionEndToEndId: string,
    private readonly customFieldInfractionId: string,
    private readonly customFieldInfractionDebitParticipant: string,
    private readonly customFieldInfractionCreditParticipant: string,

    private readonly customFieldInfractionReason: string,
    private readonly customFieldInfractionReasonFraud: string,
    private readonly customFieldInfractionReasonRequestRefund: string,
    private readonly customFieldInfractionReasonCancelDevolution: string,

    private readonly customFieldInfractionResolution: string,
    private readonly customFieldInfractionResolutionAgree: string,
    private readonly customFieldInfractionResolutionDisagree: string,

    private readonly customFieldInfractionReporter: string,
    private readonly customFieldInfractionReporterDebitedParticipant: string,
    private readonly customFieldInfractionReporterCrebitedParticipant: string,

    private readonly customFieldInfractionStatusNew: string,
    private readonly customFieldInfractionStatusOpened: string,
    private readonly customFieldInfractionStatusClosed: string,
    private readonly customFieldInfractionStatusReceived: string,
    private readonly customFieldInfractionStatusInAnalysis: string,
    private readonly customFieldInfractionStatusAcknowleged: string,
    private readonly customFieldInfractionStatusCancelled: string,
  ) {
    this.logger = logger.child({ context: JiraPixInfractionGateway.name });
  }

  async createInfraction(
    request: CreateInfractionIssueInfractionRequest,
  ): Promise<CreateInfractionIssueInfractionResponse> {
    this.logger.debug('Create infraction request.', { request });

    const gateway = new JiraCreateInfractionGateway(
      this.logger,
      this.jiraPixInfraction,
      this.infractionProjectId,
      this.infractionReporterId,
      this.infractionIssueTypeId,
      this.customFieldInfractionOperationId,
      this.customFieldInfractionReason,
      this.customFieldInfractionReasonFraud,
      this.customFieldInfractionReasonRequestRefund,
      this.customFieldInfractionReasonCancelDevolution,
    );

    return gateway.createInfraction(request);
  }

  async updateInfraction(
    request: UpdateInfractionIssueInfractionRequest,
  ): Promise<void> {
    this.logger.debug('Update infraction request.', { request });

    const gateway = new JiraUpdateInfractionGateway(
      this.logger,
      this.jiraPixInfraction,
      this.infractionProjectId,
      this.infractionReporterId,
      this.infractionIssueTypeId,

      this.customFieldInfractionOperationId,
      this.customFieldInfractionEndToEndId,
      this.customFieldInfractionId,
      this.customFieldInfractionDebitParticipant,
      this.customFieldInfractionCreditParticipant,

      this.customFieldInfractionReason,
      this.customFieldInfractionReasonFraud,
      this.customFieldInfractionReasonRequestRefund,
      this.customFieldInfractionReasonCancelDevolution,

      this.customFieldInfractionResolution,
      this.customFieldInfractionResolutionAgree,
      this.customFieldInfractionResolutionDisagree,

      this.customFieldInfractionReporter,
      this.customFieldInfractionReporterDebitedParticipant,
      this.customFieldInfractionReporterCrebitedParticipant,
    );

    return gateway.updateInfraction(request);
  }

  async updateInfractionStatus(
    request: UpdateInfractionStatusIssueInfractionRequest,
  ): Promise<void> {
    this.logger.debug('Update infraction status request.', { request });

    const gateway = new JiraUpdateInfractionStatusGateway(
      this.logger,
      this.jiraPixInfraction,

      this.customFieldInfractionStatusNew,
      this.customFieldInfractionStatusOpened,
      this.customFieldInfractionStatusClosed,
      this.customFieldInfractionStatusReceived,
      this.customFieldInfractionStatusInAnalysis,
      this.customFieldInfractionStatusAcknowleged,
      this.customFieldInfractionStatusCancelled,
    );

    return gateway.updateInfractionStatus(request);
  }
}
