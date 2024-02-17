import { Logger } from 'winston';
import {
  MissingDataException,
  ForbiddenException,
  Pagination,
  paginationToDomain,
  TPaginationResponse,
} from '@zro/common';
import { User } from '@zro/users/domain';
import {
  Operation,
  OperationEntity,
  OperationRepository,
  TGetOperationsFilter,
  UserWalletRepository,
  Wallet,
  WalletAccountCacheRepository,
  WalletAccountEntity,
} from '@zro/operations/domain';

export class GetAllOperationsByUserAndWalletAndFilterUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param operationRepository Operation repository.
   * @param walletAccountCacheRepository WalletAccountCache repository.
   */
  constructor(
    private logger: Logger,
    private readonly operationRepository: OperationRepository,
    private readonly walletAccountCacheRepository: WalletAccountCacheRepository,
    private readonly userWalletRepository: UserWalletRepository,
  ) {
    this.logger = logger.child({
      context: GetAllOperationsByUserAndWalletAndFilterUseCase.name,
    });
  }

  /**
   * Get all Operations by wallet and filter.
   * @param user User.
   * @param wallet Wallet.
   * @param pagination Pagination.
   * @param filter Fitler.
   * @returns Operation[].
   */
  async execute(
    user: User,
    wallet: Wallet,
    pagination: Pagination,
    filter: TGetOperationsFilter,
  ): Promise<TPaginationResponse<Operation>> {
    // Data input check
    if (!user?.uuid || !wallet?.uuid || !pagination || !filter) {
      throw new MissingDataException([
        ...(!user?.uuid ? ['User'] : []),
        ...(!wallet?.uuid ? ['Wallet'] : []),
        ...(!pagination ? ['Pagination'] : []),
        ...(!filter ? ['Filter'] : []),
      ]);
    }

    const userWallet = await this.userWalletRepository.getByUserAndWallet(
      user,
      wallet,
    );

    this.logger.debug('UserWallet found.', { userWallet });

    if (!userWallet) {
      throw new ForbiddenException();
    }

    const walletAccounts =
      await this.walletAccountCacheRepository.getAllByWallet(userWallet.wallet);

    this.logger.debug('Wallet accounts found.', { walletAccounts });

    if (!walletAccounts.length) {
      const total = [];
      return paginationToDomain(pagination, total.length, total);
    }

    const result =
      await this.operationRepository.getAllByWalletAccountsAndFilter(
        walletAccounts,
        pagination,
        filter,
      );

    this.logger.debug('Operations found.', { result });

    const walletAccountMap = walletAccounts.reduce(
      (acc, att) => ({
        ...acc,
        [att.id]: new WalletAccountEntity({ uuid: att.uuid, wallet }),
      }),
      {},
    );

    const operations = result.data.map(
      (operation) =>
        new OperationEntity({
          ...operation,
          ...{
            ownerWalletAccount:
              operation.ownerWalletAccount?.id &&
              walletAccountMap[operation.ownerWalletAccount.id],
          },
          ...{
            beneficiaryWalletAccount:
              operation.beneficiaryWalletAccount?.id &&
              walletAccountMap[operation.beneficiaryWalletAccount.id],
          },
        }),
    );

    this.logger.debug('Operations response.', { operations });

    return { ...result, data: operations };
  }
}
