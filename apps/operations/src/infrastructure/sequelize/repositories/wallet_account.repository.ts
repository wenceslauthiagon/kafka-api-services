import {
  DatabaseRepository,
  Pagination,
  paginationToDomain,
  paginationWhere,
  TPaginationResponse,
} from '@zro/common';
import {
  Currency,
  TGetWalletAccountFilter,
  Wallet,
  WalletAccount,
  WalletAccountRepository,
} from '@zro/operations/domain';
import { User } from '@zro/users/domain';
import {
  CurrencyModel,
  WalletAccountModel,
  WalletModel,
} from '@zro/operations/infrastructure';

export class WalletAccountDatabaseRepository
  extends DatabaseRepository
  implements WalletAccountRepository
{
  /**
   * Convert WalletAccount model to WalletAccount domain.
   * @param walletAccount Model instance.
   * @returns Domain instance.
   */
  static toDomain(walletAccount: WalletAccountModel): WalletAccount {
    return walletAccount?.toDomain() ?? null;
  }

  /**
   * Update a wallet account.
   *
   * @param walletAccount Account to be updated.
   * @returns Updated wallet account.
   */
  async update(walletAccount: WalletAccount): Promise<WalletAccount> {
    await WalletAccountModel.update(walletAccount, {
      where: { id: walletAccount.id },
      transaction: this.transaction,
    });

    return walletAccount;
  }

  /**
   * Get wallet account by ID.
   *
   * @param id Wallet account ID.
   * @returns Wallet account if found or null otherwise.
   */
  async getById(id: number): Promise<WalletAccount> {
    return WalletAccountModel.findOne({
      where: { id },
      transaction: this.transaction,
      lock: this.transaction?.LOCK.UPDATE,
    }).then(WalletAccountDatabaseRepository.toDomain);
  }

  /**
   * Get wallet account by wallet and currency.
   *
   * @param wallet Wallet.
   * @param currency Wallet account currency.
   * @returns Wallet account if found or null otherwise.
   */
  async getByWalletAndCurrency(
    wallet: Wallet,
    currency: Currency,
  ): Promise<WalletAccount> {
    return WalletAccountModel.findOne({
      where: {
        currencyId: currency.id,
        walletUUID: wallet.uuid,
      },
      transaction: this.transaction,
      lock: this.transaction?.LOCK.UPDATE,
    }).then(WalletAccountDatabaseRepository.toDomain);
  }

  /**
   * Get wallet account by user and currency.
   *
   * @param user Wallet account owner.
   * @param currency Wallet account currency.
   * @returns Wallet account if found or null otherwise.
   */
  async getByUserAndCurrency(
    user: User,
    currency: Currency,
  ): Promise<WalletAccount> {
    const wallet = await WalletModel.findOne({
      where: { userUUID: user.uuid },
      transaction: this.transaction,
    });

    if (!wallet?.id) return null;

    return WalletAccountModel.findOne({
      where: {
        currencyId: currency.id,
        walletId: wallet.id,
      },
      transaction: this.transaction,
      lock: this.transaction?.LOCK.UPDATE,
    }).then(WalletAccountDatabaseRepository.toDomain);
  }

  /**
   * Get wallet account by accountNumber and currency.
   *
   * @param accountNumber Wallet account accountNumber.
   * @param currency Wallet account currency.
   * @returns Wallet account if found or null otherwise.
   */
  async getByAccountNumberAndCurrency(
    accountNumber: string,
    currency: Currency,
  ): Promise<WalletAccount> {
    return WalletAccountModel.findOne({
      where: {
        currencyId: currency.id,
        accountNumber,
      },
      include: {
        model: WalletModel,
        required: true,
      },
      transaction: this.transaction,
      lock: this.transaction?.LOCK.UPDATE,
    }).then(WalletAccountDatabaseRepository.toDomain);
  }

  /**
   * Get all wallet account by filter.
   *
   * @param pagination Wallet account pagination.
   * @param filter Wallet account filter.
   * @returns Wallet accounts filtered.
   */
  async getByWalletAndFilter(
    wallet: Wallet,
    pagination: Pagination,
    filter: TGetWalletAccountFilter,
  ): Promise<TPaginationResponse<WalletAccount>> {
    return WalletAccountModel.findAndCountAll({
      ...paginationWhere(pagination),
      where: { walletUUID: wallet.uuid },
      include: {
        model: CurrencyModel,
        required: true,
        where: {
          ...(filter.currencySymbol && { symbol: filter.currencySymbol }),
        },
      },
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(WalletAccountDatabaseRepository.toDomain),
      ),
    );
  }

  async create(walletAccount: WalletAccount): Promise<WalletAccount> {
    return WalletAccountModel.create(walletAccount, {
      transaction: this.transaction,
    }).then(WalletAccountDatabaseRepository.toDomain);
  }

  /**
   * Get wallet account by wallet and uuid.
   *
   * @param wallet Wallet.
   * @param uuid Wallet account uuid.
   * @returns Wallet account if found or null otherwise.
   */
  async getByWalletAndUuid(
    wallet: Wallet,
    uuid: WalletAccount['uuid'],
  ): Promise<WalletAccount> {
    return WalletAccountModel.findOne({
      where: {
        uuid,
        walletUUID: wallet.uuid,
      },
      include: {
        model: CurrencyModel,
        required: true,
      },
      transaction: this.transaction,
      lock: this.transaction?.LOCK.UPDATE,
    }).then(WalletAccountDatabaseRepository.toDomain);
  }
}
