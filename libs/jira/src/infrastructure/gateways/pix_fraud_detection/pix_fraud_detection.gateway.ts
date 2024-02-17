import { Logger } from 'winston';
import * as JiraApi from 'jira-client';
import {
  UpdatePixFraudDetectionIssueRequest,
  CreatePixFraudDetectionIssueRequest,
  CreatePixFraudDetectionIssueResponse,
  IssuePixFraudDetectionGateway,
} from '@zro/pix-payments/application';
import {
  JiraUpdatePixFraudDetectionGateway,
  JiraCreatePixFraudDetectionGateway,
} from '@zro/jira/infrastructure';

export class JiraPixFraudDetectionGateway
  implements IssuePixFraudDetectionGateway
{
  constructor(
    private readonly logger: Logger,
    private readonly jiraPixFraudDetection: JiraApi,
    private readonly pixFraudDetectionProjectId: string,
    private readonly pixFraudDetectionIssueTypeId: string,

    private readonly customFieldPixFraudDetectionExternalId: string,
    private readonly customFieldPixFraudDetectionDocument: string,
    private readonly customFieldPixFraudDetectionFraudType: string,
    private readonly customFieldPixFraudDetectionKey: string,
    private readonly customFieldPixFraudDetectionFraudTypeFalseIdentification: string,
    private readonly customFieldPixFraudDetectionFraudTypeDummyAccount: string,
    private readonly customFieldPixFraudDetectionFraudTypeFraudsterAccount: string,
    private readonly customFieldPixFraudDetectionFraudTypeOther: string,
    private readonly customFieldPixFraudDetectionStatusCanceled: string,
    private readonly customFieldPixFraudDetectionTransitionCancel: string,
    private readonly customFieldPixFraudDetectionTransitionReceived: string,
  ) {
    this.logger = logger.child({ context: JiraPixFraudDetectionGateway.name });
  }

  async createPixFraudDetectionIssue(
    request: CreatePixFraudDetectionIssueRequest,
  ): Promise<CreatePixFraudDetectionIssueResponse> {
    this.logger.debug('Create pix fraud detection issue request.', { request });

    const gateway = new JiraCreatePixFraudDetectionGateway(
      this.logger,
      this.jiraPixFraudDetection,
      this.pixFraudDetectionProjectId,
      this.pixFraudDetectionIssueTypeId,
      this.customFieldPixFraudDetectionExternalId,
      this.customFieldPixFraudDetectionDocument,
      this.customFieldPixFraudDetectionFraudType,
      this.customFieldPixFraudDetectionKey,
      this.customFieldPixFraudDetectionFraudTypeFalseIdentification,
      this.customFieldPixFraudDetectionFraudTypeDummyAccount,
      this.customFieldPixFraudDetectionFraudTypeFraudsterAccount,
      this.customFieldPixFraudDetectionFraudTypeOther,
      this.customFieldPixFraudDetectionTransitionReceived,
    );

    return gateway.createPixFraudDetectionIssue(request);
  }

  async updatePixFraudDetectionIssue(
    request: UpdatePixFraudDetectionIssueRequest,
  ): Promise<void> {
    this.logger.debug('Cancel pix fraud detection issue request.', { request });

    const gateway = new JiraUpdatePixFraudDetectionGateway(
      this.logger,
      this.jiraPixFraudDetection,
      this.customFieldPixFraudDetectionExternalId,
      this.customFieldPixFraudDetectionTransitionCancel,
    );

    return gateway.updatePixFraudDetectionIssue(request);
  }
}
