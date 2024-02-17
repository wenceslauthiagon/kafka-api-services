import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { UserWithdrawSettingRequest } from '@zro/compliance/domain';

@Exception(ExceptionTypes.USER, 'USER_WITHDRAW_SETTING_REQUEST_NOT_FOUND')
export class UserWithdrawSettingRequestNotFoundException extends DefaultException {
  constructor(userWithdrawSettingRequest: Partial<UserWithdrawSettingRequest>) {
    super({
      type: ExceptionTypes.USER,
      code: 'USER_WITHDRAW_SETTING_REQUEST_NOT_FOUND',
      data: userWithdrawSettingRequest,
    });
  }
}
