import { Logger } from 'winston';
import * as JiraApi from 'jira-client';
import { DefaultException, MissingDataException } from '@zro/common';
import { PixPaymentPspException } from '@zro/pix-payments/application';
import { ProviderBadRequestException } from '@zro/jira/infrastructure';
import {
  IssueRefundGateway,
  CancelRefundIssueRequest,
  CancelRefundIssueResponse,
} from '@zro/pix-payments/application';
import { PixRefundRejectionReason } from '@zro/pix-payments/domain';

type ObjectIdType = { id: string };

type ProjectType = ObjectIdType;

type ReporterType = ObjectIdType;

export type JiraCancelRefundRequest = {
  project: ProjectType;
  reporter: ReporterType;
  [key: string]: string | ObjectIdType;
};

type JiraCancelRefundPayload = { fields: JiraCancelRefundRequest };

export type JiraCancelRefundResponse = JiraApi.JsonResponse & {
  id?: string;
  key?: string;
  errors?: string[];
};

export class JiraCancelRefundGateway
  implements Pick<IssueRefundGateway, 'cancelRefund'>
{
  constructor(
    private readonly logger: Logger,
    private readonly jiraApi: JiraApi,

    private readonly refundProjectId: string,
    private readonly refundReporterId: string,

    private readonly customFieldRefundRejectionReason: string,
    private readonly customFieldRefundRejectionAccountClosureReason: string,
    private readonly customFieldRefundRejectionCannotRefundReason: string,
    private readonly customFieldRefundRejectionNoBalanceReason: string,
    private readonly customFieldRefundRejectionOtherReason: string,

    private readonly customFieldSolicitationPspId: string,
    private readonly customFieldDevolutionEndToEndId: string,
    private readonly customFieldAnalisysDetails: string,
  ) {
    this.logger = logger.child({ context: JiraCancelRefundGateway.name });
  }

  private getRejectionReason(rejectionReason: PixRefundRejectionReason) {
    const types = {
      [PixRefundRejectionReason.ACCOUNT_CLOSURE]:
        this.customFieldRefundRejectionAccountClosureReason,
      [PixRefundRejectionReason.CANNOT_REFUND]:
        this.customFieldRefundRejectionCannotRefundReason,
      [PixRefundRejectionReason.NO_BALANCE]:
        this.customFieldRefundRejectionNoBalanceReason,
      [PixRefundRejectionReason.OTHER]:
        this.customFieldRefundRejectionOtherReason,
    };

    return (
      rejectionReason && {
        [this.customFieldRefundRejectionReason]: { id: types[rejectionReason] },
      }
    );
  }

  async cancelRefund(
    message: CancelRefundIssueRequest,
  ): Promise<CancelRefundIssueResponse> {
    // Data input check
    if (!message) {
      throw new MissingDataException(['Message']);
    }

    const payload: JiraCancelRefundPayload = {
      fields: {
        project: { id: this.refundProjectId },
        reporter: { id: this.refundReporterId },
        [this.customFieldSolicitationPspId]: message.solicitationPspId,
        [this.customFieldDevolutionEndToEndId]: message.devolutionEndToEndId,
        [this.customFieldAnalisysDetails]: message.analisysDetails,
        ...this.getRejectionReason(message.rejectionReason),
      },
    };

    this.logger.debug('Request payload.', { payload });

    try {
      const response: JiraCancelRefundResponse = await this.jiraApi.updateIssue(
        `${message.issueId}`,
        payload,
      );

      this.logger.debug('Response found.', { response });

      if (response?.errors) {
        throw new ProviderBadRequestException(response.errors);
      }

      return {
        solicitationPspId: message.solicitationPspId,
        status: message.status,
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
