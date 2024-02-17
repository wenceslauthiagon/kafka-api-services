import { Logger } from 'winston';
import * as JiraApi from 'jira-client';
import { DefaultException, MissingDataException } from '@zro/common';
import { PixRefundStatus } from '@zro/pix-payments/domain';
import {
  PixPaymentPspException,
  InvalidUpdateInfractionStatusPixPaymentPspException,
  IssueRefundGateway,
  UpdateRefundStatusIssueRefundRequest,
} from '@zro/pix-payments/application';
import { ProviderBadRequestException } from '@zro/jira/infrastructure';

export type JiraUpdateInfractionStatusRequest = {
  id: string;
};

type JiraUpdateInfractionStatusPayload = {
  transition: JiraUpdateInfractionStatusRequest;
};

export type JiraUpdateInfractionStatusResponse = JiraApi.JsonResponse & {
  id?: string;
  key?: string;
  errors?: string[];
};

export class JiraUpdateRefundStatusGateway
  implements Pick<IssueRefundGateway, 'updateRefundStatus'>
{
  constructor(
    private readonly logger: Logger,
    private readonly jiraApi: JiraApi,

    private readonly customFieldRefundStatusCancelled: string,
    private readonly customFieldRefundStatusClosed: string,
    private readonly customFieldRefundStatusReceived: string,
  ) {
    this.logger = logger.child({
      context: JiraUpdateRefundStatusGateway.name,
    });
  }

  private getStatus(status: PixRefundStatus) {
    const types = {
      [PixRefundStatus.CANCELLED]: this.customFieldRefundStatusCancelled,
      [PixRefundStatus.CLOSED]: this.customFieldRefundStatusClosed,
      [PixRefundStatus.RECEIVED]: this.customFieldRefundStatusReceived,
    };

    return { id: types[status] };
  }

  async updateRefundStatus(
    message: UpdateRefundStatusIssueRefundRequest,
  ): Promise<void> {
    // Data input check
    if (!message) {
      throw new MissingDataException(['Message']);
    }

    const payload: JiraUpdateInfractionStatusPayload = {
      transition: this.getStatus(message.status),
    };

    this.logger.debug('Request payload.', { payload });

    try {
      const response: JiraUpdateInfractionStatusResponse =
        await this.jiraApi.transitionIssue(`${message.issueId}`, payload);

      this.logger.debug('Response found.', { response });

      if (response?.errors) {
        throw new ProviderBadRequestException(response.errors);
      }
    } catch (error) {
      this.logger.error('ERROR Jira request.', { error, payload });

      if (error instanceof DefaultException) {
        throw error;
      }

      const parseMessage = (message: string) => {
        this.logger.error('ERROR Jira response.', { error: error?.message });

        if (!message) return;

        if (message.endsWith('is not valid for this issue.')) {
          throw new InvalidUpdateInfractionStatusPixPaymentPspException(
            message,
          );
        }
      };

      if (error?.message) {
        parseMessage(error?.message);
      }

      throw new PixPaymentPspException(error);
    }
  }
}
