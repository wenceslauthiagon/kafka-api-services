import { Logger } from 'winston';
import {
  Pagination,
  TPaginationResponse,
  MissingDataException,
} from '@zro/common';
import {
  WarningPixDeposit,
  WarningPixDepositRepository,
} from '@zro/pix-payments/domain';
import { User } from '@zro/users/domain';

export class GetAllWarningPixDepositUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param warningPixDepositRepository Warning Pix Deposit repository.
   */
  constructor(
    private logger: Logger,
    private readonly warningPixDepositRepository: WarningPixDepositRepository,
  ) {
    this.logger = logger.child({
      context: GetAllWarningPixDepositUseCase.name,
    });
  }

  /**
   * List all Warning Pix Deposits.
   *
   * @returns Warning Pix Deposits found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    pagination: Pagination,
    user?: User,
    transactionTag?: string,
    operationId?: string,
    createdAtPeriodStart?: Date,
    createdAtPeriodEnd?: Date,
    updatedAtPeriodStart?: Date,
    updatedAtPeriodEnd?: Date,
  ): Promise<TPaginationResponse<WarningPixDeposit>> {
    // Data input check
    if (!pagination) {
      throw new MissingDataException(['Pagination']);
    }

    // Search payments
    const result = await this.warningPixDepositRepository.getAll(
      pagination,
      user,
      transactionTag,
      operationId,
      createdAtPeriodStart,
      createdAtPeriodEnd,
      updatedAtPeriodStart,
      updatedAtPeriodEnd,
    );

    this.logger.debug('Found Warning Pix Deposits.', { result });

    return result;
  }
}
