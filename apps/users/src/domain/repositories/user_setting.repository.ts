import { UserSetting } from '@zro/users/domain';

export interface UserSettingRepository {
  /**
   * Create user setting.
   * @param userSetting User Setting object.
   * @returns User Setting created.
   */
  create(userSetting: UserSetting): Promise<UserSetting>;
}
