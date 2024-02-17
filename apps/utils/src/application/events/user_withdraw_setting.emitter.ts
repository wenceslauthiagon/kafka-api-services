import { UserWithdrawSetting } from '@zro/utils/domain';

export type UserWithdrawSettingEvent = UserWithdrawSetting;

export interface UserWithdrawSettingEventEmitter {
  /**
   * Emit created user withdraw setting event.
   * @param event event to fire.
   */
  created: (event: UserWithdrawSettingEvent) => void;
}
