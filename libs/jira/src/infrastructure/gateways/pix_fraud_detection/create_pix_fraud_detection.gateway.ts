import { Logger } from 'winston';
import * as JiraApi from 'jira-client';
import { DefaultException, MissingDataException } from '@zro/common';
import { PixFraudDetectionType } from '@zro/pix-payments/domain';
import {
  IssuePixFraudDetectionGateway,
  CreatePixFraudDetectionIssueRequest,
  CreatePixFraudDetectionIssueResponse,
  PixPaymentPspException,
} from '@zro/pix-payments/application';
import { ProviderBadRequestException } from '@zro/jira/infrastructure';

type ObjectIdType = { id: string };

type ProjectType = ObjectIdType;

type IssueType = ObjectIdType;

type JiraCreatePixFraudDetectionRequest = {
  summary: string;
  description: string;
  project: ProjectType;
  issuetype: IssueType;
  [key: string]: string | ObjectIdType;
};

type JiraCreatePixFraudDetectionPayload = {
  fields: JiraCreatePixFraudDetectionRequest;
};

export type JiraCreatePixFraudDetectionResponse = JiraApi.JsonResponse & {
  id?: string;
  key?: string;
  errors?: string[];
};

type JiraUpdateIssueStatusToReceivedRequest = {
  id: string;
};

type JiraUpdateIssueStatusToReceivedPayload = {
  transition: JiraUpdateIssueStatusToReceivedRequest;
};

export class JiraCreatePixFraudDetectionGateway
  implements
    Pick<IssuePixFraudDetectionGateway, 'createPixFraudDetectionIssue'>
{
  constructor(
    private readonly logger: Logger,
    private readonly jiraApi: JiraApi,
    private readonly pixFraudDetectionProjectId: string,
    private readonly pixFraudDetectionIssueTypeId: string,

    private readonly customFieldPixFraudDetectionExternalId: string,
    private readonly customFieldPixFraudDetectionDocument: string,
    private readonly customFieldPixFraudDetectionFraudType: string,
    private readonly customFieldPixFraudDetectionKey: string,
    private readonly customFieldPixFraudDetectionFraudTypeFalseIdentification: string,
    private readonly customFieldPixFraudDetectionFraudTypeDummyAccount: string,
    private readonly customFieldPixFraudDetectionFraudTypeFraudsterAccount: string,
    private readonly customFieldPixFraudDetectionFraudTypeOther: string,
    private readonly customFieldPixFraudDetectionTransitionReceived: string,
  ) {
    this.logger = logger.child({
      context: JiraCreatePixFraudDetectionGateway.name,
    });
  }

  private getFraudType(fraudType: PixFraudDetectionType) {
    const types = {
      [PixFraudDetectionType.FALSE_IDENTIFICATION]:
        this.customFieldPixFraudDetectionFraudTypeFalseIdentification,
      [PixFraudDetectionType.DUMMY_ACCOUNT]:
        this.customFieldPixFraudDetectionFraudTypeDummyAccount,
      [PixFraudDetectionType.FRAUDSTER_ACCOUNT]:
        this.customFieldPixFraudDetectionFraudTypeFraudsterAccount,
      [PixFraudDetectionType.OTHER]:
        this.customFieldPixFraudDetectionFraudTypeOther,
    };
    return (
      fraudType && {
        [this.customFieldPixFraudDetectionFraudType]: { id: types[fraudType] },
      }
    );
  }

  async createPixFraudDetectionIssue(
    message: CreatePixFraudDetectionIssueRequest,
  ): Promise<CreatePixFraudDetectionIssueResponse> {
    // Data input check
    if (!message) {
      throw new MissingDataException(['Message']);
    }

    const payload: JiraCreatePixFraudDetectionPayload = {
      fields: {
        summary: `[EXTERNO] Marcação de Fraude de ID ${message.externalId}.`,
        description: 'Nova Marcação de Fraude registrada pelo PSP.',
        project: { id: this.pixFraudDetectionProjectId },
        issuetype: { id: this.pixFraudDetectionIssueTypeId },
        [this.customFieldPixFraudDetectionExternalId]: message.externalId,
        [this.customFieldPixFraudDetectionDocument]: message.document,
        ...this.getFraudType(message.fraudType),
        ...(message.key && {
          [this.customFieldPixFraudDetectionKey]: message.key,
        }),
      },
    };

    this.logger.debug('Request payload.', { payload });

    try {
      const response: JiraCreatePixFraudDetectionResponse =
        await this.jiraApi.addNewIssue(payload);

      this.logger.debug('Response found.', { response });

      if (response?.errors) {
        throw new ProviderBadRequestException(response.errors);
      }

      response.id && (await this.updateStatusToReceived(response.id));

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

  async updateStatusToReceived(id: string): Promise<void> {
    const payload: JiraUpdateIssueStatusToReceivedPayload = {
      transition: {
        id: `${this.customFieldPixFraudDetectionTransitionReceived}`,
      },
    };

    const response = await this.jiraApi.transitionIssue(id, payload);

    this.logger.debug('Transitioned to RECEIVED.');

    if (response?.errors) {
      throw new ProviderBadRequestException(response.errors);
    }
  }
}
