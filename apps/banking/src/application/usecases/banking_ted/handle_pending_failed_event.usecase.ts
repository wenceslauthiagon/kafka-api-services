import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  BankingTed,
  BankingTedRepository,
  BankingTedState,
} from '@zro/banking/domain';
import {
  BankingTedNotFoundException,
  BankingTedEventEmitter,
  OperationService,
} from '@zro/banking/application';

export class HandlePendingFailedBankingTedEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository BankingTedRepository repository.
   * @param eventEmitter BankingTed event emitter.
   * @param operationService OperationService.
   */
  constructor(
    private logger: Logger,
    private readonly repository: BankingTedRepository,
    private readonly eventEmitter: BankingTedEventEmitter,
    private readonly operationService: OperationService,
  ) {
    this.logger = logger.child({
      context: HandlePendingFailedBankingTedEventUseCase.name,
    });
  }

  /**
   * Handler triggered when an error is thrown.
   *
   * @param {String} id BankingTed id.
   * @returns {BankingTed} BankingTed updated.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {BankingTedNotFoundException} Thrown when bankingTed id was not found.
   */
  async execute(id: number): Promise<BankingTed> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Search BankingTed
    const bankingTed = await this.repository.getById(id);

    this.logger.debug('Found BankingTed.', { bankingTed });

    if (!bankingTed) {
      throw new BankingTedNotFoundException({ id });
    }

    // Only PENDING bankingTed can go to FAILED state.
    if (bankingTed.state !== BankingTedState.PENDING) {
      return bankingTed;
    }

    await this.revertOperation(bankingTed);

    // Update bankingTed
    bankingTed.state = BankingTedState.FAILED;
    bankingTed.failedAt = new Date();
    await this.repository.update(bankingTed);

    // Fire FailedBankingTedEvent
    this.eventEmitter.failedBankingTed(bankingTed);

    this.logger.debug('BankingTed creation failed.', { bankingTed });

    return bankingTed;
  }

  //Revert commonOperation
  private async revertOperation(bankingTed: BankingTed) {
    const hasOperation = await this.operationService.getOperationById(
      bankingTed.operation.id,
    );

    if (hasOperation) {
      //Revert Operation Client
      await this.operationService.revertOperation(bankingTed.operation);
      this.logger.debug('BankingTed reverted.', { bankingTed });
    }
  }
}
