import { DatabaseRepository } from '@zro/common';
import {
  UserLegalAdditionalInfoRepository,
  UserLegalAdditionalInfo,
  User,
} from '@zro/users/domain';
import { UserLegalAdditionalInfoModel } from '@zro/users/infrastructure';

export class UserLegalAdditionalInfoDatabaseRepository
  extends DatabaseRepository
  implements UserLegalAdditionalInfoRepository
{
  static toDomain(
    userLegalAdditionalInfoModel: UserLegalAdditionalInfoModel,
  ): UserLegalAdditionalInfo {
    return userLegalAdditionalInfoModel?.toDomain() ?? null;
  }

  async getByUser(user: User): Promise<UserLegalAdditionalInfo> {
    return UserLegalAdditionalInfoModel.findOne<UserLegalAdditionalInfoModel>({
      where: { userId: user.uuid },
      transaction: this.transaction,
    }).then(UserLegalAdditionalInfoDatabaseRepository.toDomain);
  }
}
