import { Logger } from 'winston';
import * as JiraApi from 'jira-client';
import {
  DefaultException,
  formatToFloatValueReal,
  MissingDataException,
} from '@zro/common';
import { PixRefundReason } from '@zro/pix-payments/domain';
import { PixPaymentPspException } from '@zro/pix-payments/application';
import {
  IssueRefundGateway,
  CreateRefundIssueRequest,
  CreateRefundIssueResponse,
} from '@zro/pix-payments/application';
import { ProviderBadRequestException } from '@zro/jira/infrastructure';

type ObjectIdType = { id: string };

type ProjectType = ObjectIdType;

export type JiraCreateRefundRequest = {
  description: string;
  project: ProjectType;
  [key: string]: string | ObjectIdType;
};

type JiraCreateRefundPayload = { fields: JiraCreateRefundRequest };

export type JiraCreateRefundResponse = JiraApi.JsonResponse & {
  id?: string;
  key?: string;
  errors?: string[];
};

export class JiraCreateRefundGateway
  implements Pick<IssueRefundGateway, 'createRefund'>
{
  constructor(
    private readonly logger: Logger,
    private readonly jiraApi: JiraApi,

    private readonly refundProjectId: string,
    private readonly refundIssueTypeId: string,
    private readonly customFieldRefundEndToEndId: string,
    private readonly customFieldRefundAmount: string,
    private readonly customFieldRefundReason: string,
    private readonly customFieldRefundFraudReason: string,
    private readonly customFieldRefundOperationFlawReason: string,
    private readonly customFieldRefundCancelledReason: string,
    private readonly customFieldRefundOperationId: string,
  ) {
    this.logger = logger.child({ context: JiraCreateRefundGateway.name });
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

  async createRefund(
    message: CreateRefundIssueRequest,
  ): Promise<CreateRefundIssueResponse> {
    // Data input check
    if (!message) {
      throw new MissingDataException(['Message']);
    }

    const payload: JiraCreateRefundPayload = {
      fields: {
        summary: `[EXTERNO] Usuário ${message.clientName} reembolso`,
        description: message.description,
        issuetype: { id: this.refundIssueTypeId },
        project: { id: this.refundProjectId },
        [this.customFieldRefundEndToEndId]: message.endToEndId,
        [this.customFieldRefundAmount]: formatToFloatValueReal(message.amount),
        [this.customFieldRefundOperationId]: message.operation.id,
        ...this.getRefundReason(message.reason),
      },
    };

    this.logger.debug('Request payload.', { payload });

    try {
      const response: JiraCreateRefundResponse =
        await this.jiraApi.addNewIssue(payload);

      this.logger.debug('Response found.', { response });

      if (response?.errors) {
        throw new ProviderBadRequestException(response.errors);
      }

      return {
        issueId: response.id && Number(response.id),
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
