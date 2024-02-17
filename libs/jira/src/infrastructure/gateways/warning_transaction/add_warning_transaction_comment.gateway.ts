import { Logger } from 'winston';
import * as JiraApi from 'jira-client';
import { DefaultException, MissingDataException } from '@zro/common';
import {
  IssueWarningTransactionGateway,
  AddWarningTransactionCommentRequest,
  PixPaymentPspException,
  InvalidUpdateWarningTransactionPixPaymentPspException,
} from '@zro/pix-payments/application';
import { ProviderBadRequestException } from '@zro/jira/infrastructure';

export type JiraUpdateWarningTransactionRequest = {
  description: string;
};

export type JiraUpdateWarningTransactionResponse = JiraApi.JsonResponse & {
  id?: string;
  key?: string;
  errors?: string[];
};

export class JiraUpdateWarningTransactionGateway
  implements
    Pick<IssueWarningTransactionGateway, 'addWarningTransactionComment'>
{
  constructor(
    private readonly logger: Logger,
    private readonly jiraApi: JiraApi,
  ) {
    this.logger = logger.child({
      context: JiraUpdateWarningTransactionGateway.name,
    });
  }

  async addWarningTransactionComment(
    message: AddWarningTransactionCommentRequest,
  ): Promise<void> {
    // Data input check
    if (!message) {
      throw new MissingDataException(['Message']);
    }

    try {
      const response: JiraUpdateWarningTransactionResponse =
        await this.jiraApi.addComment(`${message.issueId}`, message.text);

      this.logger.debug('Add comment.');

      if (response?.errors) {
        throw new ProviderBadRequestException(response.errors);
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
          throw new InvalidUpdateWarningTransactionPixPaymentPspException(
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
