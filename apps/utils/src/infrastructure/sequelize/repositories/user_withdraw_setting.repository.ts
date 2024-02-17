import {
  DatabaseRepository,
  Pagination,
  TPaginationResponse,
  paginationToDomain,
  paginationWhere,
} from '@zro/common';
import {
  UserWithdrawSetting,
  UserWithdrawSettingRepository,
  WithdrawFilter,
  WithdrawSettingState,
} from '@zro/utils/domain';
import { UserWithdrawSettingModel } from '@zro/utils/infrastructure';
import { User } from '@zro/users/domain';
import { Wallet } from '@zro/operations/domain';

export class UserWithdrawSettingDatabaseRepository
  extends DatabaseRepository
  implements UserWithdrawSettingRepository
{
  static toDomain(
    userWithdrawSettingModel: UserWithdrawSettingModel,
  ): UserWithdrawSetting {
    return userWithdrawSettingModel?.toDomain() ?? null;
  }

  async create(
    userWithdrawSetting: UserWithdrawSetting,
  ): Promise<UserWithdrawSetting> {
    const createdUserWithdrawSetting =
      await UserWithdrawSettingModel.create<UserWithdrawSettingModel>(
        userWithdrawSetting,
        {
          transaction: this.transaction,
        },
      );

    userWithdrawSetting.id = createdUserWithdrawSetting.id;
    userWithdrawSetting.createdAt = createdUserWithdrawSetting.createdAt;
    userWithdrawSetting.updatedAt = createdUserWithdrawSetting.updatedAt;

    return userWithdrawSetting;
  }

  async getById(id: string): Promise<UserWithdrawSetting> {
    return UserWithdrawSettingModel.findOne<UserWithdrawSettingModel>({
      where: { id },
      transaction: this.transaction,
    }).then(UserWithdrawSettingDatabaseRepository.toDomain);
  }

  async getByUserAndId(user: User, id: string): Promise<UserWithdrawSetting> {
    return UserWithdrawSettingModel.findOne<UserWithdrawSettingModel>({
      where: { id, userId: user.uuid },
      transaction: this.transaction,
    }).then(UserWithdrawSettingDatabaseRepository.toDomain);
  }

  getAllActiveByFilter(
    withdrawFilter: WithdrawFilter,
  ): Promise<UserWithdrawSetting[]> {
    return UserWithdrawSettingModel.findAll<UserWithdrawSettingModel>({
      where: {
        state: WithdrawSettingState.ACTIVE,
        type: withdrawFilter.type,
        ...(withdrawFilter.day && { day: withdrawFilter.day }),
        ...(withdrawFilter.weekDay && { weekDay: withdrawFilter.weekDay }),
      },
      transaction: this.transaction,
    }).then((res) => res.map(UserWithdrawSettingDatabaseRepository.toDomain));
  }

  getAllByPaginationAndWallet(
    wallet: Wallet,
    pagination: Pagination,
  ): Promise<TPaginationResponse<UserWithdrawSetting>> {
    return UserWithdrawSettingModel.findAndCountAll<UserWithdrawSettingModel>({
      where: {
        walletId: wallet.uuid,
      },
      ...paginationWhere(pagination),
      transaction: this.transaction,
    }).then((res) =>
      paginationToDomain(
        pagination,
        res.count,
        res.rows.map(UserWithdrawSettingDatabaseRepository.toDomain),
      ),
    );
  }

  async update(
    userWithdrawSetting: UserWithdrawSetting,
  ): Promise<UserWithdrawSetting> {
    await UserWithdrawSettingModel.update<UserWithdrawSettingModel>(
      userWithdrawSetting,
      {
        where: { id: userWithdrawSetting.id },
        transaction: this.transaction,
      },
    );

    return userWithdrawSetting;
  }
}
