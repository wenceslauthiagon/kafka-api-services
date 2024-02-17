import { Op } from 'sequelize';
import { DatabaseRepository } from '@zro/common';
import {
  User,
  UserForgotPassword,
  UserForgotPasswordId,
  UserForgotPasswordRepository,
  UserForgotPasswordState,
} from '@zro/users/domain';
import { UserForgotPasswordModel } from '@zro/users/infrastructure';

export class UserForgotPasswordDatabaseRepository
  extends DatabaseRepository
  implements UserForgotPasswordRepository
{
  static toDomain(
    userForgotPasswordForgotPasswordModel: UserForgotPasswordModel,
  ): UserForgotPassword {
    return userForgotPasswordForgotPasswordModel?.toDomain() ?? null;
  }

  async getByUserAndState(
    userForgotPassword: User,
    state: UserForgotPasswordState,
  ): Promise<UserForgotPassword> {
    return UserForgotPasswordModel.findOne<UserForgotPasswordModel>({
      where: {
        state,
        userId: userForgotPassword.uuid,
      },
      transaction: this.transaction,
    }).then(UserForgotPasswordDatabaseRepository.toDomain);
  }

  async getById(id: UserForgotPasswordId): Promise<UserForgotPassword> {
    return UserForgotPasswordModel.findOne<UserForgotPasswordModel>({
      where: { id },
      transaction: this.transaction,
    }).then(UserForgotPasswordDatabaseRepository.toDomain);
  }

  async getByIdAndUser(
    id: string,
    userForgotPassword: User,
  ): Promise<UserForgotPassword> {
    return UserForgotPasswordModel.findOne<UserForgotPasswordModel>({
      where: { id, userId: userForgotPassword.uuid },
      transaction: this.transaction,
    }).then(UserForgotPasswordDatabaseRepository.toDomain);
  }

  async create(
    userForgotPassword: UserForgotPassword,
  ): Promise<UserForgotPassword> {
    return UserForgotPasswordModel.create(userForgotPassword, {
      transaction: this.transaction,
    }).then(UserForgotPasswordDatabaseRepository.toDomain);
  }

  async update(
    userForgotPassword: UserForgotPassword,
  ): Promise<UserForgotPassword> {
    await UserForgotPasswordModel.update(userForgotPassword, {
      where: { id: userForgotPassword.id },
      transaction: this.transaction,
    });

    return userForgotPassword;
  }

  async getByCreatedAtLessThanAndStateIn(
    createdAt: Date,
    states: UserForgotPasswordState[],
  ): Promise<UserForgotPassword[]> {
    return UserForgotPasswordModel.findAll<UserForgotPasswordModel>({
      where: {
        createdAt: { [Op.lt]: createdAt },
        state: { [Op.in]: states },
      },
      transaction: this.transaction,
    }).then((data) => data.map(UserForgotPasswordDatabaseRepository.toDomain));
  }
}
