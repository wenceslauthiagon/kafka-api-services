import { Logger } from 'winston';
import {
  MissingDataException,
  Pagination,
  TPaginationResponse,
} from '@zro/common';
import { User } from '@zro/users/domain';
import { Wallet } from '@zro/operations/domain';
import {
  PixDepositRepository,
  PixDeposit,
  PixDepositState,
} from '@zro/pix-payments/domain';

export class GetAllPixDepositUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param depositRepository PixDeposit repository.
   */
  constructor(
    private logger: Logger,
    private readonly depositRepository: PixDepositRepository,
  ) {
    this.logger = logger.child({ context: GetAllPixDepositUseCase.name });
  }

  /**
   * Get all PixDeposit.
   *
   * @returns PixDeposits found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    pagination: Pagination,
    user?: User,
    wallet?: Wallet,
    createdAtPeriodStart?: Date,
    createdAtPeriodEnd?: Date,
    endToEndId?: string,
    clientDocument?: string,
    states?: PixDepositState[],
  ): Promise<TPaginationResponse<PixDeposit>> {
    // Data input check
    if (!pagination) {
      throw new MissingDataException(['Pagination']);
    }

    // Get Deposits
    const pixDeposits = await this.depositRepository.getAll(
      pagination,
      user,
      wallet,
      createdAtPeriodStart,
      createdAtPeriodEnd,
      endToEndId,
      clientDocument,
      states,
    );

    this.logger.debug('Deposits found.', { pixDeposits });

    return pixDeposits;
  }
}
