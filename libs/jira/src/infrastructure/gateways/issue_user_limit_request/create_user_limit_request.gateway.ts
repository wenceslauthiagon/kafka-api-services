import { Logger } from 'winston';
import * as JiraApi from 'jira-client';
import {
  DefaultException,
  formatToFloatValueReal,
  MissingDataException,
} from '@zro/common';
import { PixPaymentPspException } from '@zro/pix-payments/application';
import { ProviderBadRequestException } from '@zro/jira/infrastructure';
import {
  CreateUserLimitRequestPspRequest,
  UserLimitRequestGateway,
} from '@zro/compliance/application';

type ObjectIdType = { id: string };

type ProjectType = ObjectIdType;

export type JiraCreateUserLimitRequest = {
  summary: string;
  project: ProjectType;
  [key: string]: string | ObjectIdType;
};

type JiraCreateUserLimitRequestPayload = {
  fields: JiraCreateUserLimitRequest;
};

export type JiraCreateUserLimitRequestResponse = JiraApi.JsonResponse & {
  id?: string;
  key?: string;
  errors?: string[];
};

export class JiraCreateUserLimitRequestGateway
  implements Pick<UserLimitRequestGateway, 'createUserLimitRequest'>
{
  constructor(
    private readonly logger: Logger,
    private readonly jiraApi: JiraApi,

    private readonly userLimitRequestReporterId: string,
    private readonly userLimitRequestProjectId: string,
    private readonly userLimitRequestIssueTypeId: string,

    private readonly customFieldUserLimitRequestId: string,
    private readonly customFieldUserLimitRequestUserId: string,
    private readonly customFieldUserLimitRequestUserLimitId: string,
    private readonly customFieldUserLimitRequestYearlyLimit: string,
    private readonly customFieldUserLimitRequestMonthlyLimit: string,
    private readonly customFieldUserLimitRequestDailyLimit: string,
    private readonly customFieldUserLimitRequestNightlyLimit: string,
    private readonly customFieldUserLimitRequestMaxAmount: string,
    private readonly customFieldUserLimitRequestMinAmount: string,
    private readonly customFieldUserLimitRequestMaxAmountNightly: string,
    private readonly customFieldUserLimitRequestMinAmountNightly: string,
  ) {
    this.logger = logger.child({
      context: JiraCreateUserLimitRequestGateway.name,
    });
  }

  async createUserLimitRequest(
    message: CreateUserLimitRequestPspRequest,
  ): Promise<void> {
    // Data input check
    if (!message) {
      throw new MissingDataException(['Message']);
    }

    const payload: JiraCreateUserLimitRequestPayload = {
      fields: {
        summary: `Solicitação de aumento de ${message.limitTypeDescription} - ${message.userDocument}`,
        issuetype: { id: this.userLimitRequestIssueTypeId },
        project: { id: this.userLimitRequestProjectId },
        reporter: { id: this.userLimitRequestReporterId },
        [this.customFieldUserLimitRequestId]: message.id,
        [this.customFieldUserLimitRequestUserId]: message.userId,
        [this.customFieldUserLimitRequestUserLimitId]: message.userLimitId,
        ...(message.requestYearlyLimit
          ? {
              [this.customFieldUserLimitRequestYearlyLimit]:
                formatToFloatValueReal(message.requestYearlyLimit),
            }
          : {}),
        ...(message.requestMonthlyLimit
          ? {
              [this.customFieldUserLimitRequestMonthlyLimit]:
                formatToFloatValueReal(message.requestMonthlyLimit),
            }
          : {}),
        ...(message.requestDailyLimit
          ? {
              [this.customFieldUserLimitRequestDailyLimit]:
                formatToFloatValueReal(message.requestDailyLimit),
            }
          : {}),
        ...(message.requestNightlyLimit
          ? {
              [this.customFieldUserLimitRequestNightlyLimit]:
                formatToFloatValueReal(message.requestNightlyLimit),
            }
          : {}),
        ...(message.requestMaxAmount
          ? {
              [this.customFieldUserLimitRequestMaxAmount]:
                formatToFloatValueReal(message.requestMaxAmount),
            }
          : {}),
        ...(message.requestMinAmount
          ? {
              [this.customFieldUserLimitRequestMinAmount]:
                formatToFloatValueReal(message.requestMinAmount),
            }
          : {}),
        ...(message.requestMaxAmountNightly
          ? {
              [this.customFieldUserLimitRequestMaxAmountNightly]:
                formatToFloatValueReal(message.requestMaxAmountNightly),
            }
          : {}),
        ...(message.requestMinAmountNightly
          ? {
              [this.customFieldUserLimitRequestMinAmountNightly]:
                formatToFloatValueReal(message.requestMinAmountNightly),
            }
          : {}),
      },
    };

    this.logger.debug('Request payload.', { payload });

    try {
      const response: JiraCreateUserLimitRequestResponse =
        await this.jiraApi.addNewIssue(payload);

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
