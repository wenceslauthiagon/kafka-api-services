import { Logger } from 'winston';
import * as JiraApi from 'jira-client';
import { DefaultException, MissingDataException } from '@zro/common';
import { PixInfractionType } from '@zro/pix-payments/domain';
import {
  CreateInfractionIssueInfractionRequest,
  CreateInfractionIssueInfractionResponse,
  IssueInfractionGateway,
  PixPaymentPspException,
} from '@zro/pix-payments/application';
import { ProviderBadRequestException } from '@zro/jira/infrastructure';

type ObjectIdType = { id: string };

type ProjectType = ObjectIdType;

type IssueType = ObjectIdType;

type ReporterType = ObjectIdType;

export type JiraCreateInfractionRequest = {
  summary: string;
  description: string;
  project: ProjectType;
  issuetype: IssueType;
  reporter: ReporterType;
  [key: string]: string | ObjectIdType;
};

type JiraCreateInfractionPayload = { fields: JiraCreateInfractionRequest };

export type JiraCreateInfractionResponse = JiraApi.JsonResponse & {
  id?: string;
  key?: string;
  errors?: string[];
};

export class JiraCreateInfractionGateway
  implements Pick<IssueInfractionGateway, 'createInfraction'>
{
  constructor(
    private readonly logger: Logger,
    private readonly jiraApi: JiraApi,
    private readonly infractionProjectId: string,
    private readonly infractionReporterId: string,
    private readonly infractionIssueTypeId: string,
    private readonly customFieldInfractionOperationId: string,
    private readonly customFieldInfractionReason: string,
    private readonly customFieldInfractionReasonFraud: string,
    private readonly customFieldInfractionReasonRequestRefund: string,
    private readonly customFieldInfractionReasonCancelDevolution: string,
  ) {
    this.logger = logger.child({ context: JiraCreateInfractionGateway.name });
  }

  private getReason(reason: PixInfractionType) {
    const types = {
      [PixInfractionType.FRAUD]: this.customFieldInfractionReasonFraud,
      [PixInfractionType.REFUND_REQUEST]:
        this.customFieldInfractionReasonRequestRefund,
      [PixInfractionType.CANCEL_DEVOLUTION]:
        this.customFieldInfractionReasonCancelDevolution,
    };
    return (
      reason && { [this.customFieldInfractionReason]: { id: types[reason] } }
    );
  }

  async createInfraction(
    message: CreateInfractionIssueInfractionRequest,
  ): Promise<CreateInfractionIssueInfractionResponse> {
    // Data input check
    if (!message) {
      throw new MissingDataException(['Message']);
    }

    const payload: JiraCreateInfractionPayload = {
      fields: {
        summary: `[EXTERNO] Infração cliente documento ${message.clientDocument} `,
        description: message.description,
        project: { id: this.infractionProjectId },
        reporter: { id: this.infractionReporterId },
        issuetype: { id: this.infractionIssueTypeId },
        [this.customFieldInfractionOperationId]: message.operation.id,
        ...this.getReason(message.infractionType),
      },
    };

    this.logger.debug('Request payload.', { payload });

    try {
      const response: JiraCreateInfractionResponse =
        await this.jiraApi.addNewIssue(payload);

      this.logger.debug('Response found.', { response });

      if (response?.errors) {
        throw new ProviderBadRequestException(response.errors);
      }

      return {
        issueId: response.id && Number(response.id),
        key: response.key,
      };
    } catch (error) {
      this.logger.error('ERROR Jira request.', { error });

      if (error instanceof DefaultException) {
        throw error;
      }

      throw new PixPaymentPspException(error);
    }
  }
}
