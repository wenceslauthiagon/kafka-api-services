import { DatabaseRepository } from '@zro/common';
import { UserSetting, UserSettingRepository } from '@zro/users/domain';
import { UserSettingModel } from '@zro/users/infrastructure';

export class UserSettingDatabaseRepository
  extends DatabaseRepository
  implements UserSettingRepository
{
  static toDomain(userSettingModel: UserSettingModel): UserSetting {
    return userSettingModel?.toDomain() ?? null;
  }

  async create(userSetting: UserSetting): Promise<UserSetting> {
    const createdUserSetting = await UserSettingModel.create<UserSettingModel>(
      userSetting,
      { transaction: this.transaction },
    );

    userSetting.id = createdUserSetting.id;

    return userSetting;
  }
}
