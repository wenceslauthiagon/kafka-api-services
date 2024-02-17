import { DatabaseRepository } from '@zro/common';
import {
  UserWithdrawSettingRequest,
  UserWithdrawSettingRequestRepository,
} from '@zro/compliance/domain';
import { UserWithdrawSettingRequestModel } from '@zro/compliance/infrastructure';
import { User } from '@zro/users/domain';

export class UserWithdrawSettingRequestDatabaseRepository
  extends DatabaseRepository
  implements UserWithdrawSettingRequestRepository
{
  static toDomain(
    userWithdrawSettingRequestModel: UserWithdrawSettingRequestModel,
  ): UserWithdrawSettingRequest {
    return userWithdrawSettingRequestModel?.toDomain() ?? null;
  }

  async create(
    userWithdrawSettingRequest: UserWithdrawSettingRequest,
  ): Promise<UserWithdrawSettingRequest> {
    const createdUserWithdrawSettingRequest =
      await UserWithdrawSettingRequestModel.create<UserWithdrawSettingRequestModel>(
        userWithdrawSettingRequest,
        {
          transaction: this.transaction,
        },
      );

    userWithdrawSettingRequest.id = createdUserWithdrawSettingRequest.id;
    userWithdrawSettingRequest.createdAt =
      createdUserWithdrawSettingRequest.createdAt;
    userWithdrawSettingRequest.updatedAt =
      createdUserWithdrawSettingRequest.updatedAt;

    return userWithdrawSettingRequest;
  }

  async getById(id: string): Promise<UserWithdrawSettingRequest> {
    return UserWithdrawSettingRequestModel.findOne<UserWithdrawSettingRequestModel>(
      {
        where: { id },
        transaction: this.transaction,
      },
    ).then(UserWithdrawSettingRequestDatabaseRepository.toDomain);
  }

  async update(
    userWithdrawSettingRequest: UserWithdrawSettingRequest,
  ): Promise<UserWithdrawSettingRequest> {
    await UserWithdrawSettingRequestModel.update(userWithdrawSettingRequest, {
      where: { id: userWithdrawSettingRequest.id },
      transaction: this.transaction,
    });

    return userWithdrawSettingRequest;
  }

  async getByUserAndId(
    user: User,
    id: string,
  ): Promise<UserWithdrawSettingRequest> {
    return UserWithdrawSettingRequestModel.findOne<UserWithdrawSettingRequestModel>(
      {
        where: { id, userId: user.uuid },
        transaction: this.transaction,
      },
    ).then(UserWithdrawSettingRequestDatabaseRepository.toDomain);
  }
}
