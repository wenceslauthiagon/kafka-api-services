import { DatabaseRepository } from '@zro/common';
import {
  UserPixKeyDecodeLimit,
  UserPixKeyDecodeLimitRepository,
} from '@zro/pix-keys/domain';
import { User } from '@zro/users/domain';
import { UserPixKeyDecodeLimitModel } from '@zro/pix-keys/infrastructure';

export class UserPixKeyDecodeLimitDatabaseRepository
  extends DatabaseRepository
  implements UserPixKeyDecodeLimitRepository
{
  static toDomain(
    userPixKeyDecodeLimitModel: UserPixKeyDecodeLimitModel,
  ): UserPixKeyDecodeLimit {
    return userPixKeyDecodeLimitModel?.toDomain() ?? null;
  }

  async getByUser(user: User): Promise<UserPixKeyDecodeLimit> {
    return UserPixKeyDecodeLimitModel.findOne<UserPixKeyDecodeLimitModel>({
      where: {
        userId: user.uuid,
      },
      transaction: this.transaction,
      lock: this.transaction?.LOCK.UPDATE,
    }).then(UserPixKeyDecodeLimitDatabaseRepository.toDomain);
  }

  /**
   * Create new UserPixKeyDecodeLimit.
   * @param userPixKeyDecodeLimit UserPixKeyDecodeLimit to be created.
   * @returns The created UserPixKeyDecodeLimit.
   */
  async create(
    userPixKeyDecodeLimit: UserPixKeyDecodeLimit,
  ): Promise<UserPixKeyDecodeLimit> {
    const createdUserPixKeyDecodeLimit =
      await UserPixKeyDecodeLimitModel.create<UserPixKeyDecodeLimitModel>(
        userPixKeyDecodeLimit,
        {
          transaction: this.transaction,
        },
      );

    userPixKeyDecodeLimit.createdAt = createdUserPixKeyDecodeLimit.createdAt;
    userPixKeyDecodeLimit.updatedAt = createdUserPixKeyDecodeLimit.updatedAt;
    return userPixKeyDecodeLimit;
  }

  /**
   * Update a UserPixKeyDecodeLimit.
   * @param userPixKeyDecodeLimit UserPixKeyDecodeLimit to be updated.
   * @returns The updated UserPixKeyDecodeLimit.
   */
  async update(
    userPixKeyDecodeLimit: UserPixKeyDecodeLimit,
  ): Promise<UserPixKeyDecodeLimit> {
    await UserPixKeyDecodeLimitModel.update<UserPixKeyDecodeLimitModel>(
      userPixKeyDecodeLimit,
      {
        where: { id: userPixKeyDecodeLimit.id },
        transaction: this.transaction,
      },
    );

    return userPixKeyDecodeLimit;
  }

  /**
   * Create or update UserPixKeyDecodeLimit.
   * @param userPixKeyDecodeLimit UserPixKeyDecodeLimit to be created or updated.
   * @returns The created or updated UserPixKeyDecodeLimit.
   */
  async createOrUpdate(
    userPixKeyDecodeLimit: UserPixKeyDecodeLimit,
  ): Promise<UserPixKeyDecodeLimit> {
    // If the UserPixKeyDecodeLimit exists, update the existing record. If not, create a new one.
    const [createdUserPixKeyDecodeLimit] =
      await UserPixKeyDecodeLimitModel.upsert<UserPixKeyDecodeLimitModel>(
        userPixKeyDecodeLimit,
        {
          transaction: this.transaction,
        },
      );

    userPixKeyDecodeLimit.createdAt = createdUserPixKeyDecodeLimit.createdAt;
    userPixKeyDecodeLimit.updatedAt = createdUserPixKeyDecodeLimit.updatedAt;
    return userPixKeyDecodeLimit;
  }
}
