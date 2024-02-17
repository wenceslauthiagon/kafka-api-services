import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { UserWithdrawSetting } from '@zro/utils/domain';

@Exception(ExceptionTypes.USER, 'USER_WITHDRAW_SETTING_INVALID_STATE')
export class UserWithdrawSettingInvalidStateException extends DefaultException {
  constructor(data: Partial<UserWithdrawSetting>) {
    super({
      type: ExceptionTypes.USER,
      code: 'USER_WITHDRAW_SETTING_INVALID_STATE',
      data,
    });
  }
}
