import { TranslateService as NestTranslateService } from '@zro/common';
import {
  UserLimitRequest,
  UserWithdrawSettingRequest,
} from '@zro/compliance/domain';
import { TranslateResponse, TranslateService } from '@zro/compliance/interface';

export class TranslateI18nService implements TranslateService {
  constructor(private readonly translateService: NestTranslateService) {}

  async translateUserLimitRequestState(
    userLimitRequest: UserLimitRequest,
  ): Promise<TranslateResponse> {
    const title = await this.translateService.translate(
      'compliance',
      `USER_LIMIT_REQUEST_${userLimitRequest.state}_TITLE`,
    );

    const message = await this.translateService.translate(
      'compliance',
      `USER_LIMIT_REQUEST_${userLimitRequest.state}_MESSAGE`,
    );

    return { message, title };
  }

  async translateUserWithdrawSettingRequestState(
    userWithdrawSettingRequest: UserWithdrawSettingRequest,
  ): Promise<TranslateResponse> {
    const title = await this.translateService.translate(
      'compliance',
      `USER_WITHDRAW_SETTING_REQUEST_${userWithdrawSettingRequest.analysisResult}_TITLE`,
    );

    const message = await this.translateService.translate(
      'compliance',
      `USER_WITHDRAW_SETTING_REQUEST_${userWithdrawSettingRequest.analysisResult}_MESSAGE`,
    );

    return { message, title };
  }
}
