import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { UserWithdrawSettingRequest } from '@zro/compliance/domain';

@Exception(ExceptionTypes.USER, 'USER_WITHDRAW_SETTING_REQUEST_INVALID_STATE')
export class UserWithdrawSettingRequestInvalidStateException extends DefaultException {
  constructor(userWithdrawSettingRequest: Partial<UserWithdrawSettingRequest>) {
    super({
      type: ExceptionTypes.USER,
      code: 'USER_WITHDRAW_SETTING_REQUEST_INVALID_STATE',
      data: userWithdrawSettingRequest,
    });
  }
}
