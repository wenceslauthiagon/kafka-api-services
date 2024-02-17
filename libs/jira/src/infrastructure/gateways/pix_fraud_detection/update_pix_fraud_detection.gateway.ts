import { Logger } from 'winston';
import * as JiraApi from 'jira-client';
import { DefaultException, MissingDataException } from '@zro/common';
import {
  UpdatePixFraudDetectionIssueRequest,
  IssuePixFraudDetectionGateway,
  PixPaymentPspException,
} from '@zro/pix-payments/application';
import { ProviderBadRequestException } from '@zro/jira/infrastructure';
import { PixFraudDetectionStatus } from '@zro/pix-payments/domain';

export type JiraUpdatePixFraudDetectionRequest = {
  id?: string;
  externalId?: string;
};

type JiraUpdateTransitionPixFraudDetectionPayload = {
  transition: JiraUpdatePixFraudDetectionRequest;
};

type JiraUpdateFieldsPixFraudDetectionPayload = {
  fields: JiraUpdatePixFraudDetectionRequest;
};

export type JiraUpdatePixFraudDetectionResponse = JiraApi.JsonResponse & {
  id?: string;
  key?: string;
  errors?: string[];
};

export class JiraUpdatePixFraudDetectionGateway
  implements
    Pick<IssuePixFraudDetectionGateway, 'updatePixFraudDetectionIssue'>
{
  constructor(
    private readonly logger: Logger,
    private readonly jiraApi: JiraApi,

    private readonly customFieldPixFraudDetectionExternalId: string,
    private readonly customFieldPixFraudDetectionTransitionCancel: string,
  ) {
    this.logger = logger.child({
      context: JiraUpdatePixFraudDetectionGateway.name,
    });
  }

  async updatePixFraudDetectionIssue(
    message: UpdatePixFraudDetectionIssueRequest,
  ): Promise<void> {
    // Data input check
    if (!message) {
      throw new MissingDataException(['Message']);
    }

    try {
      if (message.externalId) {
        await this.updateFields(message);
      } else if (message.status) {
        await this.updateStatus(message);
      }
    } catch (error) {
      this.logger.error('ERROR Jira request.', { error });

      if (error instanceof DefaultException) {
        throw error;
      }

      const parseMessage = (message: string) => {
        this.logger.error('ERROR Jira response.', { error: error?.message });

        if (!message) return;

        if (
          message.endsWith('is not valid for this issue.') ||
          message.endsWith(
            'does not exist or you do not have permission to see it.',
          )
        ) {
          throw new ProviderBadRequestException([message]);
        }
      };

      if (error?.message) {
        parseMessage(error?.message);
      }

      throw new PixPaymentPspException(error);
    }
  }

  async updateFields(
    message: UpdatePixFraudDetectionIssueRequest,
  ): Promise<void> {
    const payload: JiraUpdateFieldsPixFraudDetectionPayload = {
      fields: {
        [this.customFieldPixFraudDetectionExternalId]: message.externalId,
      },
    };

    this.logger.debug('Request payload.', { payload });

    const response: JiraUpdatePixFraudDetectionResponse =
      await this.jiraApi.updateIssue(`${message.issueId}`, payload);

    this.logger.debug('Response found.', { response });

    if (response?.errors) {
      throw new ProviderBadRequestException(response.errors);
    }
  }

  private getStatus(status: PixFraudDetectionStatus) {
    const types = {
      [PixFraudDetectionStatus.CANCELED_RECEIVED]:
        this.customFieldPixFraudDetectionTransitionCancel,
    };
    return { id: types[status] };
  }

  async updateStatus(
    message: UpdatePixFraudDetectionIssueRequest,
  ): Promise<void> {
    const payload: JiraUpdateTransitionPixFraudDetectionPayload = {
      transition: this.getStatus(message.status),
    };

    const response: JiraUpdatePixFraudDetectionResponse =
      await this.jiraApi.transitionIssue(`${message.issueId}`, payload);

    this.logger.debug('Transition to CANCELED.');

    if (response?.errors) {
      throw new ProviderBadRequestException(response.errors);
    }
  }
}
