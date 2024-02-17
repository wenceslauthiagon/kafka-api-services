import { UserLimitRequest } from '@zro/compliance/domain';

export type CreateUserLimitRequestPspRequest = Pick<
  UserLimitRequest,
  | 'id'
  | 'limitTypeDescription'
  | 'requestYearlyLimit'
  | 'requestMonthlyLimit'
  | 'requestDailyLimit'
  | 'requestNightlyLimit'
  | 'requestMaxAmount'
  | 'requestMinAmount'
  | 'requestMaxAmountNightly'
  | 'requestMinAmountNightly'
> & { userId: string; userDocument: string; userLimitId: string };

export interface CreateUserLimitRequestGateway {
  createUserLimitRequest(
    request: CreateUserLimitRequestPspRequest,
  ): Promise<void>;
}
