import { DatabaseRepository } from '@zro/common';
import { User } from '@zro/users/domain';
import {
  Wallet,
  UserWallet,
  UserWalletRepository,
} from '@zro/operations/domain';
import { UserWalletModel } from '@zro/operations/infrastructure';

export class UserWalletDatabaseRepository
  extends DatabaseRepository
  implements UserWalletRepository
{
  static toDomain(userWalletModel: UserWalletModel): UserWallet {
    return userWalletModel?.toDomain() ?? null;
  }

  async create(userWallet: UserWallet): Promise<UserWallet> {
    const createdUserWallet = await UserWalletModel.create<UserWalletModel>(
      userWallet,
      { transaction: this.transaction },
    );

    userWallet.id = createdUserWallet.id;
    return userWallet;
  }

  async update(userWallet: UserWallet): Promise<UserWallet> {
    await UserWalletModel.update<UserWalletModel>(userWallet, {
      where: { id: userWallet.id },
      transaction: this.transaction,
    });

    return userWallet;
  }

  async getAllByUser(user: User): Promise<UserWallet[]> {
    return UserWalletModel.findAll({
      where: { userId: user.uuid },
      transaction: this.transaction,
    }).then((data) => data.map(UserWalletDatabaseRepository.toDomain));
  }

  async getByUserAndWallet(user: User, wallet: Wallet): Promise<UserWallet> {
    return UserWalletModel.findOne({
      where: { userId: user.uuid, walletId: wallet.uuid },
      transaction: this.transaction,
    }).then(UserWalletDatabaseRepository.toDomain);
  }

  async getAllByWallet(wallet: Wallet): Promise<UserWallet[]> {
    return UserWalletModel.findAll({
      where: { walletId: wallet.uuid },
      transaction: this.transaction,
    }).then((data) => data.map(UserWalletDatabaseRepository.toDomain));
  }

  async deleteByWallet(wallet: Wallet): Promise<number> {
    return UserWalletModel.destroy({
      where: { walletId: wallet.uuid },
      transaction: this.transaction,
    });
  }

  async deleteByUserAndWallet(user: User, wallet: Wallet): Promise<number> {
    return UserWalletModel.destroy({
      where: { walletId: wallet.uuid, userId: user.uuid },
      transaction: this.transaction,
    });
  }
}
