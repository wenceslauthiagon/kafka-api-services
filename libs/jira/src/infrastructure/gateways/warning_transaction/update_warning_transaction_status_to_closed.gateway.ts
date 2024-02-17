import { Logger } from 'winston';
import * as JiraApi from 'jira-client';
import { DefaultException, MissingDataException } from '@zro/common';
import {
  WarningTransactionGateway,
  UpdateWarningTransactionStatusToClosedIssueRequest,
  CompliancePspException,
  InvalidUpdateWarningTransactionStatusToClosedCompliancePspException,
} from '@zro/compliance/application';
import {
  ProviderBadRequestException,
  IssueStatusNotFoundException,
} from '@zro/jira/infrastructure';

export type JiraUpdateWarningTransactionStatusToClosedRequest = {
  id: string;
};

type JiraUpdateWarningTransactionStatusToClosedPayload = {
  transition: JiraUpdateWarningTransactionStatusToClosedRequest;
};

export type JiraUpdateWarningTransactionStatusToClosedResponse =
  JiraApi.JsonResponse & {
    id?: string;
    key?: string;
    errors?: string[];
  };

export class JiraUpdateWarningTransactionStatusToClosedGateway
  implements
    Pick<WarningTransactionGateway, 'updateWarningTransactionStatusToClosed'>
{
  constructor(
    private readonly logger: Logger,
    private readonly jiraApi: JiraApi,

    private customFieldWarningTransactionStatusNew: string,
    private customFieldWarningTransactionStatusClosed: string,
    private customFieldWarningTransactionStatusInAnalysis: string,
    private customFieldWarningTransactionTransitionClose: string,
    private customFieldWarningTransactionTransitionInAnalysis: string,
  ) {
    this.logger = logger.child({
      context: JiraUpdateWarningTransactionStatusToClosedGateway.name,
    });
  }

  async updateWarningTransactionStatusToClosed(
    message: UpdateWarningTransactionStatusToClosedIssueRequest,
  ): Promise<void> {
    // Data input check
    if (!message) {
      throw new MissingDataException(['Message']);
    }

    try {
      const issueResponse = await this.jiraApi.getIssue(`${message.issueId}`);

      this.logger.debug('Issue found.', { data: issueResponse?.errors });

      if (issueResponse?.errors) {
        throw new ProviderBadRequestException(issueResponse?.errors);
      }

      const issueStatus: string = issueResponse?.fields?.status?.id;

      this.logger.debug('Issue Status found.', { issueStatus });

      if (!issueStatus) {
        throw new IssueStatusNotFoundException(issueStatus);
      }

      // Check indepotent.
      if (issueStatus === this.customFieldWarningTransactionStatusClosed) {
        this.logger.debug('Issue is already closed.', {
          issueId: message.issueId,
          status: issueStatus,
        });

        return;
      }

      if (issueStatus === this.customFieldWarningTransactionStatusNew) {
        let payload: JiraUpdateWarningTransactionStatusToClosedPayload = {
          transition: {
            id: `${this.customFieldWarningTransactionTransitionInAnalysis}`,
          },
        };

        let response: JiraUpdateWarningTransactionStatusToClosedResponse =
          await this.jiraApi.transitionIssue(`${message.issueId}`, payload);

        this.logger.debug('Transition to IN ANALYSIS.');

        if (response?.errors) {
          throw new ProviderBadRequestException(response.errors);
        }

        payload = {
          transition: {
            id: `${this.customFieldWarningTransactionTransitionClose}`,
          },
        };

        response = await this.jiraApi.transitionIssue(
          `${message.issueId}`,
          payload,
        );

        this.logger.debug('Transition to CLOSED.');

        if (response?.errors) {
          throw new ProviderBadRequestException(response.errors);
        }
      }

      if (issueStatus === this.customFieldWarningTransactionStatusInAnalysis) {
        const payload: JiraUpdateWarningTransactionStatusToClosedPayload = {
          transition: {
            id: `${this.customFieldWarningTransactionTransitionClose}`,
          },
        };

        const response: JiraUpdateWarningTransactionStatusToClosedResponse =
          await this.jiraApi.transitionIssue(`${message.issueId}`, payload);

        this.logger.debug('Transition to CLOSED.');

        if (response?.errors) {
          throw new ProviderBadRequestException(response.errors);
        }
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
          throw new InvalidUpdateWarningTransactionStatusToClosedCompliancePspException(
            message,
          );
        }
      };

      if (error?.message) {
        parseMessage(error?.message);
      }

      throw new CompliancePspException(error);
    }
  }
}
