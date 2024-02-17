import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { MissingDataException } from '@zro/common';
import {
  PixDepositRepository,
  PixDeposit,
  PixDepositState,
  WarningPixDepositEntity,
  WarningPixDepositRepository,
  WarningPixDepositState,
  PixDepositCacheRepository,
} from '@zro/pix-payments/domain';
import { CurrencyEntity, OperationEntity } from '@zro/operations/domain';
import {
  WarningTransactionEntity,
  warningTransactionReasonBuilder,
} from '@zro/compliance/domain';
import {
  OperationService,
  ComplianceService,
  PixDepositNotFoundException,
  WarningPixDepositEventEmitter,
  PixDepositEventEmitter,
} from '@zro/pix-payments/application';

export class HandleWaitingPixDepositEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixDepositRepository deposit repository.
   * @param warningPixDepositRepository Warning Pix Deposit repository
   * @param operationService operation Service.
   * @param complianceService compliance Service.
   * @param warningPixDepositEventEmitter Warning Pix Deposit event emitter
   * @param pixDepositEventEmitter pix deposit event emmiter.
   * @param pixDepositCacheRepository Pix Deposit Repository.
   * @param operationCurrencyTag Operation currency tag.
   * @param operationReceivedPixDepositTransactionTag Operation transaction tag.
   */
  constructor(
    private logger: Logger,
    private readonly pixDepositRepository: PixDepositRepository,
    private readonly warningPixDepositRepository: WarningPixDepositRepository,
    private readonly operationService: OperationService,
    private readonly complianceService: ComplianceService,
    private readonly warningPixDepositEventEmitter: WarningPixDepositEventEmitter,
    private readonly pixDepositEventEmitter: PixDepositEventEmitter,
    private readonly pixDepositCacheRepository: PixDepositCacheRepository,
    private readonly operationCurrencyTag: string,
    private readonly operationReceivedPixDepositTransactionTag: string,
  ) {
    this.logger = logger.child({
      context: HandleWaitingPixDepositEventUseCase.name,
    });
  }

  /**
   * Handler triggered deposit.
   *
   * @param id PixDeposit id.
   * @returns Pix deposit updated.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(id: string): Promise<PixDeposit> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Search deposit received
    const deposit = await this.pixDepositCacheRepository.getById(id);

    this.logger.debug('Found PixDeposit.', { deposit });

    // Check deposit exists
    if (!deposit) {
      throw new PixDepositNotFoundException({ id });
    }

    // Check indepotent.
    if (deposit.state === PixDepositState.RECEIVED) {
      return deposit;
    }

    // Check indepotency.
    const depositFound = await this.pixDepositRepository.getById(id);

    this.logger.debug('Check if deposit already exists.', { depositFound });

    if (depositFound) {
      return depositFound;
    }

    // Create operation
    const operation = new OperationEntity({
      id: deposit.operation.id,
      rawValue: deposit.amount,
      currency: new CurrencyEntity({ tag: this.operationCurrencyTag }),
      description: this.operationReceivedPixDepositTransactionTag,
    });

    // If there is a check with value = false, send deposit to compliance and do not accept operation.
    let acceptDeposit = true;
    const falseChecks = [];

    if (deposit.check) {
      for (const [key, value] of Object.entries(deposit.check)) {
        if (!value) {
          falseChecks.push(warningTransactionReasonBuilder(key));
          acceptDeposit = false;
        }
      }
    }

    // Is a warning deposit.
    if (!acceptDeposit) {
      // Create new deposit into database.
      const newDeposit = await this.pixDepositRepository.create(deposit);

      this.logger.debug('Deposit added to database.', { deposit: newDeposit });

      // Create but do not accept operation
      await this.operationService.createOperation(
        deposit.transactionTag,
        operation,
        null,
        deposit.wallet,
      );

      this.logger.debug(
        'Created an operation deposit for ZroBank beneficiary.',
        { operation },
      );

      // Create warning pix deposit
      const warningPixDeposit = new WarningPixDepositEntity({
        id: uuidV4(),
        operation: deposit.operation,
        user: deposit.user,
        transactionTag: deposit.transactionTag,
        state: WarningPixDepositState.CREATED,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const newWarningPixDeposit =
        await this.warningPixDepositRepository.create(warningPixDeposit);

      this.logger.debug('Created Warning Pix Deposit.', {
        newWarningPixDeposit,
      });

      // Fire WarningPixDepositEvent
      this.warningPixDepositEventEmitter.createdWarningPixDeposit({
        ...warningPixDeposit,
        deposit,
      });

      // Create warning transaction
      const reason = falseChecks.reduce((reason, item) => `${reason}; ${item}`);

      const warningTransaction = new WarningTransactionEntity({
        operation: deposit.operation,
        transactionTag: deposit.transactionTag,
        ...(deposit.endToEndId && { endToEndId: deposit.endToEndId }),
        ...(reason && { reason }),
      });

      await this.complianceService.createWarningTransaction(warningTransaction);

      this.logger.debug('Created Warning Transaction.', { warningTransaction });

      return deposit;
    }

    // Update deposit
    deposit.state = PixDepositState.RECEIVED;

    await this.pixDepositCacheRepository.update(deposit);

    // Create new deposit into database.
    const newDeposit = await this.pixDepositRepository.create(deposit);

    this.logger.debug('Deposit added to database.', { deposit: newDeposit });

    // Create and accept operation
    await this.operationService.createAndAcceptOperation(
      deposit.transactionTag,
      operation,
      null,
      deposit.wallet,
    );

    this.logger.debug(
      'Created and accepted an operation deposit for ZroBank beneficiary.',
      { operation },
    );

    // Fire ReceivedDeposit Event
    this.pixDepositEventEmitter.receivedDeposit({
      ...deposit,
      refundOperationId: uuidV4(),
    });

    return newDeposit;
  }
}
