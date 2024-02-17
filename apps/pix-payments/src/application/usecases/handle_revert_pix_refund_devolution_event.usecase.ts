import { Logger } from 'winston';
import { Failed, MissingDataException } from '@zro/common';
import {
  PixDepositRepository,
  PixInfractionRefundOperationRepository,
  PixInfractionRefundOperationState,
  PixRefundDevolution,
  PixRefundDevolutionRepository,
  PixRefundDevolutionState,
  PixRefundDevolutionTransactionType,
  PixRefundRepository,
  TGetPixInfractionRefundOperationFilter,
} from '@zro/pix-payments/domain';
import {
  OperationService,
  PixDepositNotFoundException,
  PixRefundDevolutionNotFoundException,
  PixRefundDevolutionEventEmitter,
  PixRefundDevolutionInvalidStateException,
  PixRefundNotFoundException,
} from '@zro/pix-payments/application';

export class HandleRevertPixRefundDevolutionEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param refundDevolutionRepository PixRefundDevolution repository.
   * @param depositRepository PixDeposit repository.
   * @param pixInfractionRefundOperationRepository Pix infraction refund operation repository.
   * @param pixRefundRepository Pix refund repository.
   * @param eventEmitter PixRefundDevolution event emitter.
   * @param operationService Operation service.
   */
  constructor(
    private logger: Logger,
    private readonly refundDevolutionRepository: PixRefundDevolutionRepository,
    private readonly depositRepository: PixDepositRepository,
    private readonly pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository,
    private readonly pixRefundRepository: PixRefundRepository,
    private readonly eventEmitter: PixRefundDevolutionEventEmitter,
    private readonly operationService: OperationService,
  ) {
    this.logger = logger.child({
      context: HandleRevertPixRefundDevolutionEventUseCase.name,
    });
  }

  /**
   * Handler triggered when an revert is thrown.
   *
   * @param {String} id PixRefundDevolution id.
   * @returns {PixRefundDevolution} PixRefundDevolution updated.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {PixRefundDevolutionNotFoundException} Thrown when devolution id was not found.
   */
  async execute(
    id: string,
    chargebackReason?: string,
    failed?: Failed,
  ): Promise<PixRefundDevolution> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Search PixRefundDevolution
    const refundDevolution = await this.refundDevolutionRepository.getById(id);

    this.logger.debug('Found PixRefundDevolution.', { refundDevolution });

    if (!refundDevolution) {
      throw new PixRefundDevolutionNotFoundException({ id });
    }

    // Check indepotent
    if (refundDevolution.state === PixRefundDevolutionState.FAILED) {
      return refundDevolution;
    }

    // Check sanity
    if (
      ![
        PixRefundDevolutionState.PENDING,
        PixRefundDevolutionState.WAITING,
        PixRefundDevolutionState.CONFIRMED,
      ].includes(refundDevolution.state)
    ) {
      throw new PixRefundDevolutionInvalidStateException(refundDevolution);
    }
    if (
      refundDevolution.transactionType ===
      PixRefundDevolutionTransactionType.DEPOSIT
    ) {
      // Search deposit
      const deposit = await this.depositRepository.getById(
        refundDevolution.transaction.id,
      );

      this.logger.debug('Found deposit.', { deposit });

      if (!deposit) {
        throw new PixDepositNotFoundException({
          id: refundDevolution.transaction.id,
        });
      }

      // Update the pixDeposit returned amount with the refundDevolution amount
      deposit.returnedAmount -= refundDevolution.amount;

      // Update pixDeposit
      await this.depositRepository.update(deposit);
    }

    // Update refundDevolution
    refundDevolution.state = PixRefundDevolutionState.FAILED;
    refundDevolution.chargebackReason = chargebackReason;
    refundDevolution.failed = failed;

    await this.refundDevolutionRepository.update(refundDevolution);

    // Fire ErrorPixRefundDevolutionEvent
    this.eventEmitter.failedRefundDevolution(refundDevolution);

    // Revert Operation Client
    await this.revertOperation(refundDevolution);

    return refundDevolution;
  }

  // Revert commonOperation
  private async revertOperation(refundDevolution: PixRefundDevolution) {
    const hasOperation = await this.operationService.getOperationById(
      refundDevolution.operation.id,
    );

    if (hasOperation) {
      // Revert Operation Client
      await this.revertRefundOperations(refundDevolution);

      this.logger.debug('PixRefundDevolution reverted.', { refundDevolution });
    } else {
      Object.assign(refundDevolution, {
        operationId: null,
        operation: { id: null },
      });
    }
  }

  private async revertRefundOperations(
    pixRefundDevolution: PixRefundDevolution,
  ): Promise<void> {
    const pixRefund =
      await this.pixRefundRepository.getByRefundDevolution(pixRefundDevolution);

    this.logger.debug('Found pix refund.', { pixRefund });

    if (!pixRefund) {
      throw new PixRefundNotFoundException({
        refundDevolution: pixRefundDevolution,
      });
    }

    // Check if infraction has any open pix infraction refund operation.
    const filter: TGetPixInfractionRefundOperationFilter = {
      pixRefund,
      states: [PixInfractionRefundOperationState.OPEN],
    };

    const pixInfractionRefundOperations =
      await this.pixInfractionRefundOperationRepository.getAllByFilter(filter);

    this.logger.debug('Pix infraction refund operations found.', {
      pixInfractionRefundOperations,
    });

    // Refund is not associated to any refund operation.
    if (!pixInfractionRefundOperations?.length) return;

    for (const pixInfractionRefundOperation of pixInfractionRefundOperations) {
      // Revert pix infraction refund operation's refund operation.
      await this.operationService.revertOperation(
        pixInfractionRefundOperation.refundOperation,
      );

      this.logger.debug('Reverted refund operation.', {
        operation: pixInfractionRefundOperation.refundOperation,
      });

      // Close pix infraction refund operation.
      pixInfractionRefundOperation.state =
        PixInfractionRefundOperationState.CLOSED;

      await this.pixInfractionRefundOperationRepository.update(
        pixInfractionRefundOperation,
      );

      this.logger.debug('Updated pix infraction refund operation.', {
        pixInfractionRefundOperation,
      });
    }
  }
}
