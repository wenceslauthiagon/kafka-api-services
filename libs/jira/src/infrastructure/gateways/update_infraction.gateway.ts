import { Logger } from 'winston';
import * as JiraApi from 'jira-client';
import { DefaultException, MissingDataException } from '@zro/common';
import {
  PixInfractionAnalysisResultType,
  PixInfractionType,
  PixInfractionReport,
} from '@zro/pix-payments/domain';
import {
  UpdateInfractionIssueInfractionRequest,
  IssueInfractionGateway,
  PixPaymentPspException,
} from '@zro/pix-payments/application';
import { ProviderBadRequestException } from '@zro/jira/infrastructure';

type ObjectIdType = { id: string };

type ProjectType = ObjectIdType;

type IssueType = ObjectIdType;

type ReporterType = ObjectIdType;

export type JiraUpdateInfractionRequest = {
  summary: string;
  description: string;
  project: ProjectType;
  issuetype: IssueType;
  reporter: ReporterType;
  duedate?: string;
  [key: string]: string | ObjectIdType;
};

type JiraUpdateInfractionPayload = { fields: JiraUpdateInfractionRequest };

export type JiraUpdateInfractionResponse = JiraApi.JsonResponse & {
  id?: string;
  key?: string;
  errors?: string[];
};

export class JiraUpdateInfractionGateway
  implements Pick<IssueInfractionGateway, 'updateInfraction'>
{
  constructor(
    private readonly logger: Logger,
    private readonly jiraApi: JiraApi,
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
  ) {
    this.logger = logger.child({ context: JiraUpdateInfractionGateway.name });
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

  private getReport(report: PixInfractionReport) {
    const types = {
      [PixInfractionReport.DEBITED_PARTICIPANT]:
        this.customFieldInfractionReporterDebitedParticipant,
      [PixInfractionReport.CREDITED_PARTICIPANT]:
        this.customFieldInfractionReporterCrebitedParticipant,
    };
    return (
      report && { [this.customFieldInfractionReporter]: { id: types[report] } }
    );
  }

  private getResolution(resolution: PixInfractionAnalysisResultType) {
    const types = {
      [PixInfractionAnalysisResultType.AGREED]:
        this.customFieldInfractionResolutionAgree,
      [PixInfractionAnalysisResultType.DISAGREED]:
        this.customFieldInfractionResolutionDisagree,
    };
    return (
      resolution && {
        [this.customFieldInfractionResolution]: { id: types[resolution] },
      }
    );
  }

  async updateInfraction(
    message: UpdateInfractionIssueInfractionRequest,
  ): Promise<void> {
    // Data input check
    if (!message) {
      throw new MissingDataException(['Message']);
    }

    const payload: JiraUpdateInfractionPayload = {
      fields: {
        summary: message.summary,
        description: message.description,
        project: { id: this.infractionProjectId },
        reporter: { id: this.infractionReporterId },
        issuetype: { id: this.infractionIssueTypeId },
        ...(message.dueDate && { duedate: message.dueDate }),
        ...(message.operation?.id && {
          [this.customFieldInfractionOperationId]: message.operation?.id,
        }),
        ...(message.endToEndId && {
          [this.customFieldInfractionEndToEndId]: message.endToEndId,
        }),
        ...(message.infractionPspId && {
          [this.customFieldInfractionId]: message.infractionPspId,
        }),
        ...(message.ispbDebitedParticipant && {
          [this.customFieldInfractionDebitParticipant]:
            message.ispbDebitedParticipant,
        }),
        ...(message.ispbCreditedParticipant && {
          [this.customFieldInfractionCreditParticipant]:
            message.ispbCreditedParticipant,
        }),
        ...this.getReport(message.reportBy),
        ...this.getReason(message.infractionType),
        ...this.getResolution(message.analysisResult),
      },
    };

    this.logger.debug('Request payload.', { payload });

    try {
      const response: JiraUpdateInfractionResponse =
        await this.jiraApi.updateIssue(`${message.issueId}`, payload);

      this.logger.debug('Response found.', { response });

      if (response?.errors) {
        throw new ProviderBadRequestException(response.errors);
      }
    } catch (error) {
      this.logger.error('ERROR Jira request.', { error });

      if (error instanceof DefaultException) {
        throw error;
      }

      throw new PixPaymentPspException(error);
    }
  }
}
