import { Logger } from 'winston';
import {
  MissingDataException,
  ForbiddenException,
  Pagination,
  paginationToDomain,
  TPaginationResponse,
  getMoment,
} from '@zro/common';
import { User } from '@zro/users/domain';
import {
  Operation,
  OperationEntity,
  OperationRepository,
  OperationState,
  TGetOperationsFilter,
  UserWalletRepository,
  Wallet,
  WalletAccountEntity,
  WalletAccountCacheRepository,
  WalletAccountTransaction,
  WalletAccountTransactionRepository,
} from '@zro/operations/domain';

type TStatementInfo = {
  operation: Operation;
  walletAccountTransaction: WalletAccountTransaction;
};

export class GetStatementUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param operationRepository Operation repository.
   * @param walletAccountCacheRepository WalletAccountCache repository.
   * @param walletAccountTransactionRepository WalletAccountTransaction repository.
   * @param userWalletRepository userWallet repository.
   */
  constructor(
    private logger: Logger,
    private readonly operationRepository: OperationRepository,
    private readonly walletAccountCacheRepository: WalletAccountCacheRepository,
    private readonly walletAccountTransactionRepository: WalletAccountTransactionRepository,
    private readonly userWalletRepository: UserWalletRepository,
  ) {
    this.logger = logger.child({ context: GetStatementUseCase.name });
  }

  /**
   * Get statement.
   * @param user User.
   * @param wallet Wallet.
   * @param pagination Pagination.
   * @param filter Filter.
   * @returns TStatementInfo[].
   */
  async execute(
    user: User,
    wallet: Wallet,
    pagination: Pagination,
    filter: TGetOperationsFilter,
  ): Promise<TPaginationResponse<TStatementInfo>> {
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

    filter.createdAtStart =
      filter.createdAtStart ?? getMoment().subtract(90, 'days').toDate();

    filter.createdAtEnd = filter.createdAtEnd ?? getMoment().toDate();

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

    const statements: TStatementInfo[] = [];
    const operations = result.data.map(
      (item) =>
        new OperationEntity({
          ...item,
          ...{
            ownerWalletAccount:
              item.ownerWalletAccount?.id &&
              walletAccountMap[item.ownerWalletAccount.id],
          },
          ...{
            beneficiaryWalletAccount:
              item.beneficiaryWalletAccount?.id &&
              walletAccountMap[item.beneficiaryWalletAccount.id],
          },
        }),
    );

    for (const item of operations) {
      const walletAccountTransaction =
        item.state === OperationState.ACCEPTED
          ? await this.walletAccountTransactionRepository.getByOperation(item)
          : null;

      this.logger.debug('WalletAccountTransaction found.', {
        walletAccountTransaction,
      });

      statements.push({ operation: item, walletAccountTransaction });
    }

    this.logger.debug('Statement information response.', { statements });

    return { ...result, data: statements };
  }
}
