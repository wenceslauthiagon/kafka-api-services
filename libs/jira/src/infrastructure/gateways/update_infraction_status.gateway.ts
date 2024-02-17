import { Logger } from 'winston';
import * as JiraApi from 'jira-client';
import { DefaultException, MissingDataException } from '@zro/common';
import { PixInfractionStatus } from '@zro/pix-payments/domain';
import {
  IssueInfractionGateway,
  PixPaymentPspException,
  UpdateInfractionStatusIssueInfractionRequest,
  InvalidUpdateInfractionStatusPixPaymentPspException,
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

export class JiraUpdateInfractionStatusGateway
  implements Pick<IssueInfractionGateway, 'updateInfractionStatus'>
{
  constructor(
    private readonly logger: Logger,
    private readonly jiraApi: JiraApi,

    private readonly customFieldInfractionStatusNew: string,
    private readonly customFieldInfractionStatusOpened: string,
    private readonly customFieldInfractionStatusClosed: string,
    private readonly customFieldInfractionStatusReceived: string,
    private readonly customFieldInfractionStatusInAnalysis: string,
    private readonly customFieldInfractionStatusAcknowleged: string,
    private readonly customFieldInfractionStatusCancelled: string,
  ) {
    this.logger = logger.child({
      context: JiraUpdateInfractionStatusGateway.name,
    });
  }

  private getStatus(status: PixInfractionStatus) {
    const types = {
      [PixInfractionStatus.NEW]: this.customFieldInfractionStatusNew,
      [PixInfractionStatus.OPENED]: this.customFieldInfractionStatusOpened,
      [PixInfractionStatus.CLOSED]: this.customFieldInfractionStatusClosed,
      [PixInfractionStatus.RECEIVED]: this.customFieldInfractionStatusReceived,
      [PixInfractionStatus.IN_ANALYSIS]:
        this.customFieldInfractionStatusInAnalysis,
      [PixInfractionStatus.ACKNOWLEDGED]:
        this.customFieldInfractionStatusAcknowleged,
      [PixInfractionStatus.CANCELLED]:
        this.customFieldInfractionStatusCancelled,
    };
    return { id: types[status] };
  }

  async updateInfractionStatus(
    message: UpdateInfractionStatusIssueInfractionRequest,
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
