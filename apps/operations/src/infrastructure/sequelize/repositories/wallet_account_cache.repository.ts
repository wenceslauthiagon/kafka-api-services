import { DatabaseRepository } from '@zro/common';
import { User } from '@zro/users/domain';
import {
  Wallet,
  WalletAccount,
  WalletAccountCacheRepository,
} from '@zro/operations/domain';
import {
  WalletModel,
  CurrencyModel,
  WalletAccountCacheModel,
} from '@zro/operations/infrastructure';

export class WalletAccountCacheDatabaseRepository
  extends DatabaseRepository
  implements WalletAccountCacheRepository
{
  /**
   * Convert WalletAccountCache model to WalletAccountCache domain.
   * @param walletAccountCache Model instance.
   * @returns Domain instance.
   */
  static toDomain(walletAccountCache: WalletAccountCacheModel): WalletAccount {
    return walletAccountCache?.toDomain() ?? null;
  }

  async getAllByUser(user: User): Promise<WalletAccount[]> {
    return WalletAccountCacheModel.findAll<WalletAccountCacheModel>({
      include: [
        {
          model: WalletModel,
          required: true,
          where: { userUUID: user.uuid },
        },
        {
          model: CurrencyModel,
          required: true,
        },
      ],
      transaction: this.transaction,
    }).then((data) => data.map(WalletAccountCacheDatabaseRepository.toDomain));
  }

  async getAllByWallet(wallet: Wallet): Promise<WalletAccount[]> {
    return WalletAccountCacheModel.findAll({
      where: {
        walletUUID: wallet.uuid,
      },
      include: {
        model: CurrencyModel,
        required: true,
      },
      transaction: this.transaction,
    }).then((data) => data.map(WalletAccountCacheDatabaseRepository.toDomain));
  }

  async getById(id: number): Promise<WalletAccount> {
    return WalletAccountCacheModel.findOne<WalletAccountCacheModel>({
      where: { id },
      transaction: this.transaction,
    }).then(WalletAccountCacheDatabaseRepository.toDomain);
  }
}
