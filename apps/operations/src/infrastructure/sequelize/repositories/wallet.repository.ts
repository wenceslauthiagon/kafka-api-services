import { Op } from 'sequelize';
import { DatabaseRepository } from '@zro/common';
import { User } from '@zro/users/domain';
import { Wallet, WalletRepository, WalletState } from '@zro/operations/domain';
import { WalletModel } from '@zro/operations/infrastructure';

export class WalletDatabaseRepository
  extends DatabaseRepository
  implements WalletRepository
{
  /**
   * Convert  Wallet model to Wallet domain.
   * @param wallet Model instance.
   * @returns Domain instance.
   */
  static toDomain(wallet: WalletModel): Wallet {
    return wallet?.toDomain() ?? null;
  }

  async create(wallet: Wallet): Promise<Wallet> {
    return WalletModel.create<WalletModel>(wallet, {
      transaction: this.transaction,
    }).then(WalletDatabaseRepository.toDomain);
  }

  /**
   * Update a wallet.
   *
   * @param wallet Wallet to be updated.
   * @returns Wallet updated.
   */
  async update(wallet: Wallet): Promise<Wallet> {
    await WalletModel.update<WalletModel>(wallet, {
      where: { id: wallet.id },
      transaction: this.transaction,
    });

    return wallet;
  }

  /**
   * Delete wallet.
   *
   * @param wallet Wallet.
   * @returns Wallet deleted.
   */
  async delete(wallet: Wallet): Promise<number> {
    return WalletModel.destroy<WalletModel>({
      where: { uuid: wallet.uuid },
      transaction: this.transaction,
    });
  }

  /**
   * Get wallet by uuid.
   *
   * @param uuid Wallet owner.
   * @returns Wallet if found or null otherwise.
   */
  async getByUuid(uuid: string): Promise<Wallet> {
    return WalletModel.findOne<WalletModel>({
      where: {
        uuid,
      },
      transaction: this.transaction,
    }).then(WalletDatabaseRepository.toDomain);
  }

  /**
   * Get wallet by user and state is deactivate.
   *
   * @param user Wallet owner.
   * @returns Wallet if found or null otherwise.
   */
  async countByUserAndStateIsNotDeactivate(user: User): Promise<number> {
    return WalletModel.count<WalletModel>({
      where: {
        userUUID: user.uuid,
        state: {
          [Op.not]: WalletState.DEACTIVATE,
        },
      },
      transaction: this.transaction,
    });
  }

  /**
   * Get wallet by user and default is true.
   *
   * @param user Wallet owner.
   * @returns Wallet if found or null otherwise.
   */
  async getByUserAndDefaultIsTrue(user: User): Promise<Wallet> {
    return WalletModel.findOne<WalletModel>({
      where: {
        userUUID: user.uuid,
        default: true,
      },
      transaction: this.transaction,
    }).then(WalletDatabaseRepository.toDomain);
  }

  /**
   * Get all wallets by user.
   * @param wallets
   * @returns Wallets
   */
  async getAllByUser(user: User): Promise<Wallet[]> {
    return WalletModel.findAll<WalletModel>({
      where: {
        userUUID: user.uuid,
      },
      transaction: this.transaction,
    }).then((data) => data.map(WalletDatabaseRepository.toDomain));
  }
}
