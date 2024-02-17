import { Logger } from 'winston';
import {
  Pagination,
  TPaginationResponse,
  MissingDataException,
} from '@zro/common';
import { Wallet } from '@zro/operations/domain';
import {
  UserWithdrawSetting,
  UserWithdrawSettingRepository,
} from '@zro/utils/domain';

export class GetAllUserWithdrawSettingUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param userWithdrawSettingRepository UserWithdrawSetting repository.
   */
  constructor(
    private logger: Logger,
    private readonly userWithdrawSettingRepository: UserWithdrawSettingRepository,
  ) {
    this.logger = logger.child({
      context: GetAllUserWithdrawSettingUseCase.name,
    });
  }

  /**
   * List all UserWithdrawSetting by wallet.
   *
   * @returns UserWithdrawSetting found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    pagination: Pagination,
    wallet: Wallet,
  ): Promise<TPaginationResponse<UserWithdrawSetting>> {
    // Data input check
    if (!pagination) {
      throw new MissingDataException(['Pagination']);
    }

    // Search payments
    const UserWithdrawSettingPaginated =
      await this.userWithdrawSettingRepository.getAllByPaginationAndWallet(
        wallet,
        pagination,
      );

    this.logger.debug('UserWithdrawSetting found.', {
      UserWithdrawSettingPaginated,
    });

    return UserWithdrawSettingPaginated;
  }
}
