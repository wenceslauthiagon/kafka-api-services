import { Transaction } from 'sequelize';
import { DatabaseRepository } from '@zro/common';
import {
  UserLimitRequest,
  UserLimitRequestRepository,
} from '@zro/compliance/domain';
import { UserLimitRequestModel } from '@zro/compliance/infrastructure';

export class UserLimitRequestDatabaseRepository
  extends DatabaseRepository
  implements UserLimitRequestRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(
    userLimitRequestModel: UserLimitRequestModel,
  ): UserLimitRequest {
    return userLimitRequestModel?.toDomain() ?? null;
  }

  async create(userLimitRequest: UserLimitRequest): Promise<UserLimitRequest> {
    const createdUserLimitRequest =
      await UserLimitRequestModel.create<UserLimitRequestModel>(
        userLimitRequest,
        {
          transaction: this.transaction,
        },
      );

    userLimitRequest.id = createdUserLimitRequest.id;
    userLimitRequest.createdAt = createdUserLimitRequest.createdAt;
    userLimitRequest.updatedAt = createdUserLimitRequest.updatedAt;

    return userLimitRequest;
  }

  async getById(id: string): Promise<UserLimitRequest> {
    return UserLimitRequestModel.findOne<UserLimitRequestModel>({
      where: { id },
      transaction: this.transaction,
    }).then(UserLimitRequestDatabaseRepository.toDomain);
  }

  async update(userLimitRequest: UserLimitRequest): Promise<UserLimitRequest> {
    await UserLimitRequestModel.update(userLimitRequest, {
      where: { id: userLimitRequest.id },
      transaction: this.transaction,
    });

    return userLimitRequest;
  }
}
