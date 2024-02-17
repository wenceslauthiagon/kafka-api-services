import {
  UserLimitRequest,
  UserWithdrawSettingRequest,
} from '@zro/compliance/domain';

export type TranslateResponse = {
  message: string;
  title: string;
};

export interface TranslateService {
  translateUserLimitRequestState(
    userLimitRequest: UserLimitRequest,
  ): Promise<TranslateResponse>;

  translateUserWithdrawSettingRequestState(
    userWithdrawSettingRequest: UserWithdrawSettingRequest,
  ): Promise<TranslateResponse>;
}
