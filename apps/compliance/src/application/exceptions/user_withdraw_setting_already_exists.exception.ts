import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { UserWithdrawSetting } from '@zro/utils/domain';

@Exception(ExceptionTypes.USER, 'USER_WITHDRAW_SETTING_ALREADY_EXISTS')
export class UserWithdrawSettingAlreadyExistsException extends DefaultException {
  constructor(userWithdrawSetting: Partial<UserWithdrawSetting>) {
    super({
      type: ExceptionTypes.USER,
      code: 'USER_WITHDRAW_SETTING_ALREADY_EXISTS',
      data: { userWithdrawSetting },
    });
  }
}
