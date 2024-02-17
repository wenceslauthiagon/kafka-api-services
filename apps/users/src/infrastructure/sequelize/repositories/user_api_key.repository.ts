import { DatabaseRepository } from '@zro/common';
import { User, UserApiKey, UserApiKeyRepository } from '@zro/users/domain';
import { UserApiKeyModel } from '@zro/users/infrastructure';

export class UserApiKeyDatabaseRepository
  extends DatabaseRepository
  implements UserApiKeyRepository
{
  static toDomain(userApiKeyModel: UserApiKeyModel): UserApiKey {
    return userApiKeyModel?.toDomain() ?? null;
  }

  async create(userApiKey: UserApiKey): Promise<UserApiKey> {
    const createdUserApiKey = await UserApiKeyModel.create<UserApiKeyModel>(
      userApiKey,
      { transaction: this.transaction },
    );

    userApiKey.id = createdUserApiKey.id;
    userApiKey.updatedAt = createdUserApiKey.updatedAt;

    return userApiKey;
  }

  async update(userApiKey: UserApiKey): Promise<UserApiKey> {
    await UserApiKeyModel.update<UserApiKeyModel>(userApiKey, {
      where: { id: userApiKey.id },
      transaction: this.transaction,
    });

    return userApiKey;
  }

  async getById(id: string): Promise<UserApiKey> {
    return UserApiKeyModel.findOne({
      where: { id },
      transaction: this.transaction,
    }).then(UserApiKeyDatabaseRepository.toDomain);
  }

  async getByUser(user: User): Promise<UserApiKey> {
    return UserApiKeyModel.findOne({
      where: { userId: user.uuid },
      transaction: this.transaction,
    }).then(UserApiKeyDatabaseRepository.toDomain);
  }
}
