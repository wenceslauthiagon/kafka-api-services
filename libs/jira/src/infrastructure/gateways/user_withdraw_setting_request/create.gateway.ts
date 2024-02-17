import { Logger } from 'winston';
import * as JiraApi from 'jira-client';
import {
  DefaultException,
  formatToFloatValueReal,
  GatewayException,
  MissingDataException,
} from '@zro/common';
import { ProviderBadRequestException } from '@zro/jira/infrastructure';
import {
  CreateUserWithdrawSettingRequestGatewayRequest,
  CreateUserWithdrawSettingRequestGatewayResponse,
  UserWithdrawSettingRequestGateway,
} from '@zro/compliance/application';
import {
  WithdrawSettingType,
  WithdrawSettingWeekDays,
} from '@zro/compliance/domain';

type ObjectIdType = { id: string };

type ProjectType = ObjectIdType;

export type JiraCreateUserWithdrawSettingRequest = {
  summary: string;
  project: ProjectType;
  [key: string]: string | ObjectIdType;
};

export type JiraCreateUserWithdrawSettingRequestPayload = {
  fields: JiraCreateUserWithdrawSettingRequest;
};

export type JiraCreateUserWithdrawSettingRequestResponse =
  JiraApi.JsonResponse & {
    id?: string;
    key?: string;
    errors?: string[];
  };

export class JiraUserWithdrawSettingRequestGateway
  implements UserWithdrawSettingRequestGateway
{
  constructor(
    private readonly logger: Logger,
    private readonly jiraApi: JiraApi,

    private readonly userWithdrawSettingRequestProjectId: string,
    private readonly userWithdrawSettingRequestIssueTypeId: string,

    private readonly customFieldUserWithdrawSettingRequestId: string,
    private readonly customFieldUserWithdrawSettingRequestUserId: string,
    private readonly customFieldUserWithdrawSettingRequestWalletId: string,
    private readonly customFieldUserWithdrawSettingRequestTransactionTypeId: string,
    private readonly customFieldUserWithdrawSettingRequestPixKey: string,
    private readonly customFieldUserWithdrawSettingRequestPixKeyType: string,

    private readonly customFieldUserWithdrawSettingRequestType: string,
    private readonly customFieldUserWithdrawSettingRequestBalanceType: string,
    private readonly customFieldUserWithdrawSettingRequestDailyType: string,
    private readonly customFieldUserWithdrawSettingRequestMonthlyType: string,
    private readonly customFieldUserWithdrawSettingRequestWeeklyType: string,

    private readonly customFieldUserWithdrawSettingRequestBalance: string,
    private readonly customFieldUserWithdrawSettingRequestDay: string,

    private readonly customFieldUserWithdrawSettingRequestWeekDay: string,
    private readonly customFieldUserWithdrawSettingRequestMondayWeekDay: string,
    private readonly customFieldUserWithdrawSettingRequestTuesdayWeekDay: string,
    private readonly customFieldUserWithdrawSettingRequestWednesdayWeekDay: string,
    private readonly customFieldUserWithdrawSettingRequestThursdayWeekDay: string,
    private readonly customFieldUserWithdrawSettingRequestFridayWeekDay: string,
    private readonly customFieldUserWithdrawSettingRequestSaturdayWeekDay: string,
    private readonly customFieldUserWithdrawSettingRequestSundayWeekDay: string,
  ) {
    this.logger = logger.child({
      context: JiraUserWithdrawSettingRequestGateway.name,
    });
  }

  private getType(type: WithdrawSettingType) {
    const types = {
      [WithdrawSettingType.BALANCE]:
        this.customFieldUserWithdrawSettingRequestBalanceType,
      [WithdrawSettingType.DAILY]:
        this.customFieldUserWithdrawSettingRequestDailyType,
      [WithdrawSettingType.MONTHLY]:
        this.customFieldUserWithdrawSettingRequestMonthlyType,
      [WithdrawSettingType.WEEKLY]:
        this.customFieldUserWithdrawSettingRequestWeeklyType,
    };

    return (
      type && {
        [this.customFieldUserWithdrawSettingRequestType]: { id: types[type] },
      }
    );
  }

  private getWeekDay(weekDay: WithdrawSettingWeekDays) {
    const weekDays = {
      [WithdrawSettingWeekDays.MONDAY]:
        this.customFieldUserWithdrawSettingRequestMondayWeekDay,
      [WithdrawSettingWeekDays.TUESDAY]:
        this.customFieldUserWithdrawSettingRequestTuesdayWeekDay,
      [WithdrawSettingWeekDays.WEDNESDAY]:
        this.customFieldUserWithdrawSettingRequestWednesdayWeekDay,
      [WithdrawSettingWeekDays.THURSDAY]:
        this.customFieldUserWithdrawSettingRequestThursdayWeekDay,
      [WithdrawSettingWeekDays.FRIDAY]:
        this.customFieldUserWithdrawSettingRequestFridayWeekDay,
      [WithdrawSettingWeekDays.SATURDAY]:
        this.customFieldUserWithdrawSettingRequestSaturdayWeekDay,
      [WithdrawSettingWeekDays.SUNDAY]:
        this.customFieldUserWithdrawSettingRequestSundayWeekDay,
    };

    return (
      weekDay && {
        [this.customFieldUserWithdrawSettingRequestWeekDay]: {
          id: weekDays[weekDay],
        },
      }
    );
  }

  private translateType(type: WithdrawSettingType) {
    const types = {
      [WithdrawSettingType.BALANCE]: 'Balanço',
      [WithdrawSettingType.DAILY]: 'Diário',
      [WithdrawSettingType.MONTHLY]: 'Mensal',
      [WithdrawSettingType.WEEKLY]: 'Semanal',
    };

    return types[type];
  }

  async create(
    message: CreateUserWithdrawSettingRequestGatewayRequest,
  ): Promise<CreateUserWithdrawSettingRequestGatewayResponse> {
    // Data input check
    if (!message) {
      throw new MissingDataException(['Message']);
    }

    const payload: JiraCreateUserWithdrawSettingRequestPayload = {
      fields: {
        summary: `Solicitação de saque automático - ${this.translateType(
          message.type,
        )} - ${message.transactionType.tag} - ${message.user.document} - ${
          message.wallet.name
        }`,
        issuetype: { id: this.userWithdrawSettingRequestIssueTypeId },
        project: { id: this.userWithdrawSettingRequestProjectId },
        [this.customFieldUserWithdrawSettingRequestId]: message.id,
        [this.customFieldUserWithdrawSettingRequestUserId]: message.user.uuid,
        [this.customFieldUserWithdrawSettingRequestWalletId]:
          message.wallet.uuid,
        [this.customFieldUserWithdrawSettingRequestTransactionTypeId]:
          message.transactionType.id.toString(),
        [this.customFieldUserWithdrawSettingRequestPixKey]: message.pixKey.key,
        [this.customFieldUserWithdrawSettingRequestPixKeyType]:
          message.pixKey.type,
        ...this.getType(message.type),
        [this.customFieldUserWithdrawSettingRequestBalance]:
          formatToFloatValueReal(message.balance),
        ...(message.day
          ? {
              [this.customFieldUserWithdrawSettingRequestDay]:
                message.day.toString(),
            }
          : {}),
        ...this.getWeekDay(message.weekDay),
      },
    };

    this.logger.debug('Request payload.', { payload });

    try {
      const response: JiraCreateUserWithdrawSettingRequestResponse =
        await this.jiraApi.addNewIssue(payload);

      this.logger.debug('Response found.', { response });

      if (response?.errors) {
        throw new ProviderBadRequestException(response.errors);
      }

      return {
        issueId: response.id,
        key: response.key,
      };
    } catch (error) {
      this.logger.error('ERROR Jira request.', { error });

      if (error instanceof DefaultException) {
        throw error;
      }

      throw new GatewayException(error);
    }
  }
}
