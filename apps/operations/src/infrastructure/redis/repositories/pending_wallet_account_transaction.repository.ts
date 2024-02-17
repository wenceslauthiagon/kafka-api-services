import { RedisKey, RedisService } from '@zro/common';
import {
  PendingWalletAccountTransaction,
  PendingWalletAccountTransactionRepository,
  WalletAccount,
} from '@zro/operations/domain';
import { PendingWalletAccountTransactionModel } from '@zro/operations/infrastructure';

const PREFIX = 'wallet_account_transaction';

export class PendingWalletAccountTransactionRedisRepository
  implements PendingWalletAccountTransactionRepository
{
  constructor(private redisService: RedisService) {}

  static toDomain(wallet: RedisKey<PendingWalletAccountTransactionModel>) {
    return (
      wallet?.data &&
      new PendingWalletAccountTransactionModel(wallet.data).toDomain()
    );
  }

  private async createOrUpdate(
    walletAccountTransaction: PendingWalletAccountTransaction,
  ): Promise<void> {
    const result: RedisKey<PendingWalletAccountTransactionModel> = {
      key: `${PREFIX}:WALLET_ACCOUNT:${walletAccountTransaction.walletAccount.id}:OPERATION:${walletAccountTransaction.operation.id}`,
      data: new PendingWalletAccountTransactionModel(walletAccountTransaction),
      ttl: walletAccountTransaction.ttl,
    };

    await this.redisService.set<PendingWalletAccountTransactionModel>(result);
  }

  async create(
    walletAccountTransaction: PendingWalletAccountTransaction,
  ): Promise<PendingWalletAccountTransaction> {
    await this.createOrUpdate(walletAccountTransaction);
    return walletAccountTransaction;
  }

  async update(
    walletAccountTransaction: PendingWalletAccountTransaction,
  ): Promise<PendingWalletAccountTransaction> {
    await this.createOrUpdate(walletAccountTransaction);
    return walletAccountTransaction;
  }

  async getByWalletAccount(
    walletAccount: WalletAccount,
  ): Promise<PendingWalletAccountTransaction[]> {
    return this.redisService
      .search<PendingWalletAccountTransactionModel>(
        `${PREFIX}:WALLET_ACCOUNT:${walletAccount.id}:*`,
      )
      .then((models) =>
        models.map(PendingWalletAccountTransactionRedisRepository.toDomain),
      );
  }
}
