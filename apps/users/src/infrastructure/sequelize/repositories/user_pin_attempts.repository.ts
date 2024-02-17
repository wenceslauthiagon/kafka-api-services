import { DatabaseRepository } from '@zro/common';
import {
  UserPinAttempts,
  UserPinAttemptsRepository,
  User,
} from '@zro/users/domain';
import { UserPinAttemptsModel } from '@zro/users/infrastructure';

export class UserPinAttemptsDatabaseRepository
  extends DatabaseRepository
  implements UserPinAttemptsRepository
{
  static toDomain(userPinAttemptsModel: UserPinAttemptsModel): UserPinAttempts {
    return userPinAttemptsModel?.toDomain() ?? null;
  }

  async create(userPinAttempts: UserPinAttempts): Promise<UserPinAttempts> {
    const createdUserPinAttempts =
      await UserPinAttemptsModel.create<UserPinAttemptsModel>(userPinAttempts, {
        transaction: this.transaction,
      });

    userPinAttempts.id = createdUserPinAttempts.id;
    userPinAttempts.updatedAt = createdUserPinAttempts.updatedAt;

    return userPinAttempts;
  }

  async update(userPinAttempts: UserPinAttempts): Promise<UserPinAttempts> {
    const [, [updatedUserPinAttempts]] =
      await UserPinAttemptsModel.update<UserPinAttemptsModel>(userPinAttempts, {
        where: { id: userPinAttempts.id },
        returning: true,
        transaction: this.transaction,
      });

    userPinAttempts.updatedAt = updatedUserPinAttempts.updatedAt;

    return userPinAttempts;
  }

  async getByUser(user: User): Promise<UserPinAttempts> {
    return UserPinAttemptsModel.findOne({
      where: { userId: user.id },
      transaction: this.transaction,
      lock: this.transaction?.LOCK.UPDATE,
    }).then(UserPinAttemptsDatabaseRepository.toDomain);
  }
}
