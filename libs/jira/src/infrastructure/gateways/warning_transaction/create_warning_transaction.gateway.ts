import { Logger } from 'winston';
import * as JiraApi from 'jira-client';
import { DefaultException, MissingDataException } from '@zro/common';
import {
  CreateWarningTransactionRequest,
  CreateWarningTransactionResponse,
  WarningTransactionGateway,
  WarningTransactionException,
} from '@zro/compliance/application';
import { ProviderBadRequestException } from '@zro/jira/infrastructure';

type ObjectIdType = { id: string };

type ProjectType = ObjectIdType;

type IssueType = ObjectIdType;

export type JiraCreateWarningTransactionRequest = {
  summary: string;
  description: string;
  project: ProjectType;
  issuetype: IssueType;
  [key: string]: string | ObjectIdType;
};

type JiraCreateWarningTransactionPayload = {
  fields: JiraCreateWarningTransactionRequest;
};

export type JiraCreateWarningTransactionResponse = JiraApi.JsonResponse & {
  id?: string;
  key?: string;
  errors?: string[];
};

export class JiraCreateWarningTransactionGateway
  implements Pick<WarningTransactionGateway, 'createWarningTransaction'>
{
  constructor(
    private readonly logger: Logger,
    private readonly jiraApi: JiraApi,
    private readonly warningTransactionProjectId: string,
    private readonly warningTransactionIssueTypeId: string,

    private readonly customFieldWarningTransactionOperationId: string,
    private readonly customFieldWarningTransactionTransactionTag: string,
    private readonly customFieldWarningTransactionEndToEndId: string,
    private readonly customFieldWarningTransactionReason: string,
  ) {
    this.logger = logger.child({
      context: JiraCreateWarningTransactionGateway.name,
    });
  }

  async createWarningTransaction(
    message: CreateWarningTransactionRequest,
  ): Promise<CreateWarningTransactionResponse> {
    // Data input check
    if (!message) {
      throw new MissingDataException(['Message']);
    }

    const payload: JiraCreateWarningTransactionPayload = {
      fields: {
        summary: `Bloqueio cautelar da operação de ID ${message.operation.id}.`,
        description: 'Bloqueio cautelar.',
        project: { id: this.warningTransactionProjectId },
        issuetype: { id: this.warningTransactionIssueTypeId },
        [this.customFieldWarningTransactionOperationId]: message.operation.id,
        [this.customFieldWarningTransactionTransactionTag]:
          message.transactionTag,
        ...(message.endToEndId && {
          [this.customFieldWarningTransactionEndToEndId]: message.endToEndId,
        }),
        ...(message.reason && {
          [this.customFieldWarningTransactionReason]: message.reason,
        }),
      },
    };

    this.logger.debug('Request payload.', { payload });

    try {
      const response: JiraCreateWarningTransactionResponse =
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

      throw new WarningTransactionException(error);
    }
  }
}
