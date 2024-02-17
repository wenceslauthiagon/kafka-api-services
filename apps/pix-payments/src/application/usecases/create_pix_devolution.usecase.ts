import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { MissingDataException, ForbiddenException } from '@zro/common';
import { Operation, OperationEntity, Wallet } from '@zro/operations/domain';
import { User } from '@zro/users/domain';
import {
  PixDevolution,
  PixDevolutionEntity,
  PixDevolutionRepository,
  PixDepositRepository,
  PixDevolutionState,
  PixDevolutionCode,
} from '@zro/pix-payments/domain';
import {
  PixDevolutionEventEmitter,
  PixDevolutionAmountOverflowException,
  PixDevolutionMaxNumberException,
  PixDepositNotFoundException,
  PixDepositExpiredDevolutionTimeException,
} from '@zro/pix-payments/application';

export class CreatePixDevolutionUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param devolutionRepository PixDevolution repository.
   * @param depositRepository PixDeposit repository.
   * @param eventEmitter PixDevolution event emitter.
   * @param devolutionMaxNumber PixDevolution max number.
   * @param depositDevolutionIntervalDays PixDevolution interval days.
   * @param staticWithdrawalTransactionTag Static Withdrawal TransactionTag.
   * @param dinamicWithdrawalTransactionTag Dinamic Withdrawal TransactionTag.
   * @param dinamicChangeTransactionTag Dinamic Change TransactionTag.
   */
  constructor(
    private logger: Logger,
    private readonly devolutionRepository: PixDevolutionRepository,
    private readonly depositRepository: PixDepositRepository,
    private readonly eventEmitter: PixDevolutionEventEmitter,
    private readonly devolutionMaxNumber: number,
    private readonly depositDevolutionIntervalDays: number,
    private readonly staticWithdrawalTransactionTag: string,
    private readonly dinamicWithdrawalTransactionTag: string,
    private readonly dinamicChangeTransactionTag: string,
  ) {
    this.logger = logger.child({ context: CreatePixDevolutionUseCase.name });
  }

  /**
   * Create Devolution.
   *
   * @param id Devolution id.
   * @param user Devolution user.
   * @param wallet Devolution wallet.
   * @param operation Devolution operation.
   * @param amount Devolution amount.
   * @param [description] Devolution description.
   * @returns Devolution created.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    id: string,
    user: User,
    wallet: Wallet,
    operation: Operation,
    amount: number,
    description?: string,
  ): Promise<PixDevolution> {
    // Data input check
    if (!id || !user?.uuid || !wallet?.uuid || !operation?.id || !amount) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!user?.uuid ? ['User'] : []),
        ...(!wallet?.uuid ? ['Wallet'] : []),
        ...(!operation?.id ? ['Operation'] : []),
        ...(!amount ? ['Amount'] : []),
      ]);
    }

    // Check if devolution's ID is available
    const devolution = await this.devolutionRepository.getById(id);

    this.logger.debug('Check if devolution already exists.', { devolution });

    if (devolution) {
      if (devolution.wallet.uuid !== wallet.uuid) {
        throw new ForbiddenException();
      }
      return devolution;
    }

    // Get deposit by operation id
    const deposit = await this.depositRepository.getByOperationAndWallet(
      operation,
      wallet,
    );

    this.logger.debug('Deposit found.', { deposit });

    if (!deposit) {
      throw new PixDepositNotFoundException({ operation });
    }

    // If the deposit was created before the defined interval days, the devolution cannot be requested
    if (!deposit.canCreateDevolution(this.depositDevolutionIntervalDays)) {
      throw new PixDepositExpiredDevolutionTimeException({
        createdAt: deposit.createdAt,
      });
    }

    // Check if amount is greater than deposit amount
    if (amount > deposit.amount) {
      throw new PixDevolutionAmountOverflowException({
        amount: deposit.amount,
      });
    }

    // Check if there's limit to create devolution
    if (this.devolutionMaxNumber) {
      // Get all devolution quantity with the same deposit id
      const devolutionCount =
        await this.devolutionRepository.countByDeposit(deposit);

      this.logger.debug('Devolution quantity found.', { devolutionCount });

      if (devolutionCount >= this.devolutionMaxNumber) {
        throw new PixDevolutionMaxNumberException(devolutionCount);
      }
    }

    // Get the available amount of the deposit to be returned
    const availableAmount = deposit.amount - deposit.returnedAmount;

    // Check if amount is greater than available value of deposit
    if (amount > availableAmount) {
      throw new PixDevolutionAmountOverflowException({
        amount: availableAmount,
      });
    }

    // Update the pixDeposit returned amount with the devolution amount
    deposit.returnedAmount += amount;

    // Update pixDeposit
    await this.depositRepository.update(deposit);

    // Set pending status and fire event pending
    const newDevolution = new PixDevolutionEntity({
      id,
      user,
      operation: new OperationEntity({ id: uuidV4() }),
      wallet,
      deposit,
      amount,
      description,
      devolutionCode: PixDevolutionCode.ORIGINAL,
      state: PixDevolutionState.PENDING,
    });

    if (
      [
        this.staticWithdrawalTransactionTag,
        this.dinamicWithdrawalTransactionTag,
        this.dinamicChangeTransactionTag,
      ].includes(deposit.transactionTag)
    ) {
      newDevolution.devolutionCode = PixDevolutionCode.WITHDRAWAL_CHANGE;
    }

    // Save Devolution on database
    await this.devolutionRepository.create(newDevolution);

    // Fire PendingDevolutionEvent
    this.eventEmitter.pendingDevolution(newDevolution);

    this.logger.debug('Devolution added.', { newDevolution });

    return newDevolution;
  }
}
