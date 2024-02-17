import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import {
  PixRefundRepository,
  PixRefundDevolutionRepository,
  PixRefundDevolution,
  PixDepositRepository,
  PixDevolutionReceivedRepository,
  PixRefundTransaction,
  PixRefundTransactionType,
  PixRefundDevolutionEntity,
  PixRefundDevolutionTransactionType,
  PixDevolutionCode,
  PixRefundDevolutionState,
  PixRefund,
  TGetPixInfractionRefundOperationFilter,
  PixInfractionRefundOperationState,
  PixInfractionRefundOperationRepository,
} from '@zro/pix-payments/domain';
import {
  PixRefundDevolutionEventEmitter,
  PixTransactionNotFoundException,
  PixRefundNotFoundException,
  PixRefundDevolutionAmountOverflowException,
  PixRefundDevolutionMaxNumberException,
  PixRefundTransactionExpiredDevolutionTimeException,
} from '@zro/pix-payments/application';

export class HandleCreatePixRefundDevolutionEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param refundDevolutionRepository refundDevolution repository.
   * @param refundRepository refund repository.
   * @param eventRefundDevolutionEmitter PixRefundDevolution event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly refundDevolutionRepository: PixRefundDevolutionRepository,
    private readonly refundRepository: PixRefundRepository,
    private readonly eventRefundDevolutionEmitter: PixRefundDevolutionEventEmitter,
    private readonly depositRepository: PixDepositRepository,
    private readonly devolutionReceivedRepository: PixDevolutionReceivedRepository,
    private readonly pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository,
    private readonly refundDevolutionMaxNumber: number,
    private readonly transactionRefundDevolutionIntervalDays: number,
  ) {
    this.logger = logger.child({
      context: HandleCreatePixRefundDevolutionEventUseCase.name,
    });
  }

  async execute(id: string, refundId: string): Promise<PixRefundDevolution> {
    // Data input check
    if (!id || !refundId) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!refundId ? ['Pix Refund ID'] : []),
      ]);
    }

    // Check if devolution's ID is available
    const refundDevolution = await this.refundDevolutionRepository.getById(id);

    this.logger.debug('Check if refundDevolution already exists.', {
      refundDevolution,
    });

    if (refundDevolution) {
      return refundDevolution;
    }

    //Check pixRefund
    const refund = await this.refundRepository.getById(refundId);

    this.logger.debug('Check if refund exists.', {
      refund,
    });

    if (!refund) {
      throw new PixRefundNotFoundException({ id: refundId });
    }

    const devolutionReceived = await this.devolutionReceivedRepository.getById(
      refund.transaction.id,
    );
    const deposit = await this.depositRepository.getById(refund.transaction.id);

    this.logger.debug('Check if devolution or deposit exists.', {
      devolutionReceived,
      deposit,
    });

    if (!devolutionReceived && !deposit) {
      throw new PixTransactionNotFoundException({
        id: refund.transaction.id,
      });
    }

    const transactionFound: PixRefundTransaction =
      deposit || devolutionReceived;

    // If refund createdAt is before than today added interval days, the refund devolution cannot be requested
    if (
      !refund.canCreateRefundDevolution(
        this.transactionRefundDevolutionIntervalDays,
      )
    ) {
      throw new PixRefundTransactionExpiredDevolutionTimeException({
        createdAt: refund.createdAt,
      });
    }

    // Check if amount is greater than deposit amount
    if (refund.amount > transactionFound.amount) {
      throw new PixRefundDevolutionAmountOverflowException({
        amount: refund.amount,
      });
    }

    // Check if there's limit to create refund devolution
    if (this.refundDevolutionMaxNumber) {
      // Get all refund devolution quantity with the same transaction id
      const refundDevolutionCount =
        await this.refundDevolutionRepository.countByTransaction(
          refund.transaction.id,
        );

      this.logger.debug('Found refund devolution quantity.', {
        refundDevolutionCount,
      });

      if (refundDevolutionCount >= this.refundDevolutionMaxNumber) {
        throw new PixRefundDevolutionMaxNumberException(refundDevolutionCount);
      }
    }

    // Get the available amount of the transaction to be returned
    const availableAmount =
      transactionFound.amount - transactionFound.returnedAmount;

    // Get the total amount of the transaction to be returned
    const refundAmount = await this.calculateRefundAmount(refund);

    // Check if amount is greater than available value of transaction
    if (refundAmount > availableAmount) {
      throw new PixRefundDevolutionAmountOverflowException({
        amount: availableAmount,
      });
    }

    // Update the original transaction returned amount with the refund amount
    if (refund.transactionType === PixRefundTransactionType.DEPOSIT) {
      deposit.returnedAmount += refundAmount;
      // Update pixDeposit
      await this.depositRepository.update(deposit);
    } else {
      devolutionReceived.returnedAmount += refundAmount;
      await this.devolutionReceivedRepository.update(devolutionReceived);
    }

    // Set pending status and fire event pending
    const newRefundDevolution = new PixRefundDevolutionEntity({
      id,
      user: new UserEntity({ uuid: transactionFound.user.uuid }),
      operation: refund.operation,
      transaction: transactionFound,
      transactionType: deposit
        ? PixRefundDevolutionTransactionType.DEPOSIT
        : PixRefundDevolutionTransactionType.DEVOLUTION_RECEIVED,
      amount: refundAmount,
      description: transactionFound.description,
      devolutionCode: PixDevolutionCode.FRAUD,
      state: PixRefundDevolutionState.PENDING,
    });

    // Save Devolution on database
    await this.refundDevolutionRepository.create(newRefundDevolution);

    // Fire PendingDevolutionEvent
    this.eventRefundDevolutionEmitter.pendingRefundDevolution(
      newRefundDevolution,
    );

    this.logger.debug('Added devolution.', { newRefundDevolution });

    return newRefundDevolution;
  }

  private async calculateRefundAmount(pixRefund: PixRefund): Promise<number> {
    let amount = 0;

    // Check if refund has any open pix infraction refund operation.
    const filter: TGetPixInfractionRefundOperationFilter = {
      pixRefund,
      states: [PixInfractionRefundOperationState.OPEN],
    };

    const pixInfractionRefundOperations =
      await this.pixInfractionRefundOperationRepository.getAllByFilter(filter);

    this.logger.debug('Pix infraction refund operations found.', {
      pixInfractionRefundOperations,
    });

    // Pix refund is not associated to any refund operation.
    if (!pixInfractionRefundOperations?.length) return;

    for (const pixInfractionRefundOperation of pixInfractionRefundOperations) {
      amount += pixInfractionRefundOperation.refundOperation.value;
    }

    return amount;
  }
}
