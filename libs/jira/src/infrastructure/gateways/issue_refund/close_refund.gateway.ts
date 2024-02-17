import { Logger } from 'winston';
import * as JiraApi from 'jira-client';
import { DefaultException, MissingDataException } from '@zro/common';
import { PixPaymentPspException } from '@zro/pix-payments/application';
import { ProviderBadRequestException } from '@zro/jira/infrastructure';
import {
  IssueRefundGateway,
  CloseRefundIssueRequest,
  CloseRefundIssueResponse,
} from '@zro/pix-payments/application';
import { PixRefundReason, PixRefundStatus } from '@zro/pix-payments/domain';

type ObjectIdType = { id: string };

type ProjectType = ObjectIdType;

type ReporterType = ObjectIdType;

export type JiraCloseRefundRequest = {
  project: ProjectType;
  reporter: ReporterType;
  [key: string]: string | ObjectIdType;
};

type JiraCloseRefundPayload = { fields: JiraCloseRefundRequest };

export type JiraCloseRefundResponse = JiraApi.JsonResponse & {
  id?: string;
  key?: string;
  errors?: string[];
};

export class JiraCloseRefundGateway
  implements Pick<IssueRefundGateway, 'closeRefund'>
{
  constructor(
    private readonly logger: Logger,
    private readonly jiraApi: JiraApi,

    private readonly refundProjectId: string,
    private readonly refundReporterId: string,

    private readonly customFieldSolicitationPspId: string,

    private readonly customFieldRefundReason: string,
    private readonly customFieldRefundFraudReason: string,
    private readonly customFieldRefundOperationFlawReason: string,
    private readonly customFieldRefundCancelledReason: string,
  ) {
    this.logger = logger.child({ context: JiraCloseRefundGateway.name });
  }

  private getRefundReason(refundReason: PixRefundReason) {
    const types = {
      [PixRefundReason.FRAUD]: this.customFieldRefundFraudReason,
      [PixRefundReason.OPERATIONAL_FLAW]:
        this.customFieldRefundOperationFlawReason,
      [PixRefundReason.REFUND_CANCELLED]: this.customFieldRefundCancelledReason,
    };

    return (
      refundReason && {
        [this.customFieldRefundReason]: { id: types[refundReason] },
      }
    );
  }

  async closeRefund(
    message: CloseRefundIssueRequest,
  ): Promise<CloseRefundIssueResponse> {
    // Data input check
    if (!message) {
      throw new MissingDataException(['Message']);
    }

    const payload: JiraCloseRefundPayload = {
      fields: {
        project: { id: this.refundProjectId },
        reporter: { id: this.refundReporterId },
        description: message.description,
        [this.customFieldSolicitationPspId]: message.solicitationPspId,
        ...this.getRefundReason(message.reason),
      },
    };

    this.logger.debug('Request payload.', { payload });

    try {
      const response: JiraCloseRefundResponse = await this.jiraApi.updateIssue(
        `${message.issueId}`,
        payload,
      );

      this.logger.debug('Response found.', { response });

      if (response?.errors) {
        throw new ProviderBadRequestException(response.errors);
      }

      return {
        solicitationPspId: message.solicitationPspId,
        status: PixRefundStatus.CLOSED,
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
