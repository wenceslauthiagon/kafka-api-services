import { Logger } from 'winston';
import {
  Pagination,
  TPaginationResponse,
  MissingDataException,
  PaginationOrder,
} from '@zro/common';
import {
  WalletAccount,
  WalletAccountRepository,
  TGetWalletAccountFilter,
  Wallet,
} from '@zro/operations/domain';

export class GetAllWalletAccountUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param walletAccountRepository WalletAccount repository.
   */
  constructor(
    private logger: Logger,
    private readonly walletAccountRepository: WalletAccountRepository,
  ) {
    this.logger = logger.child({ context: GetAllWalletAccountUseCase.name });
  }

  /**
   * List all walletAccounts by filter.
   *
   * @param wallet User.
   * @param pagination Pagination.
   * @param filter TGetWalletAccountFilter.
   * @returns WalletAccounts found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    wallet: Wallet,
    pagination: Pagination,
    filter: TGetWalletAccountFilter,
  ): Promise<TPaginationResponse<WalletAccount>> {
    // Data input check
    if (!wallet?.uuid || !pagination || !filter) {
      throw new MissingDataException([
        ...(!wallet?.uuid ? ['Wallet'] : []),
        ...(!pagination ? ['Pagination'] : []),
        ...(!filter ? ['Filter'] : []),
      ]);
    }

    const { sort, order, ...paginationData } = pagination;

    // Search walletAccounts
    const result = await this.walletAccountRepository.getByWalletAndFilter(
      wallet,
      paginationData,
      filter,
    );

    if (!result.data.length) return result;

    // Sort the currencies found
    if (sort) {
      result.data.sort((prev, next) =>
        order === PaginationOrder.ASC
          ? prev.currency.symbol.localeCompare(next.currency.symbol)
          : next.currency.symbol.localeCompare(prev.currency.symbol),
      );
    }

    this.logger.debug('WalletAccounts found.', { result });

    return result;
  }
}
