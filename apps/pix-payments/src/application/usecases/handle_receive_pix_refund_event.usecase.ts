import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { MissingDataException, getMoment } from '@zro/common';
import {
  PixRefund,
  PixRefundTransaction,
  PixRefundReason,
  PixRefundEntity,
  PixRefundRepository,
  PixRefundState,
  PixRefundStatus,
  PixInfraction,
  PixInfractionRepository,
  PixInfractionAnalysisResultType,
  PixInfractionState,
  PixRefundTransactionType,
  PixDepositRepository,
  PixDevolutionReceivedRepository,
  TGetPixInfractionRefundOperationFilter,
  PixInfractionRefundOperationRepository,
  PixInfractionRefundOperationEntity,
  PixInfractionRefundOperationState,
} from '@zro/pix-payments/domain';
import { Bank } from '@zro/banking/domain';
import { CurrencyEntity, OperationEntity } from '@zro/operations/domain';
import {
  PixRefundEventEmitter,
  PixRefundLimitDateException,
  PixRefundInvalidStateException,
  PixInfractionNotFoundException,
  PixInfractionInvalidStateException,
  PixTransactionNotFoundException,
  OperationService,
} from '@zro/pix-payments/application';
import { OperationNotFoundException } from '@zro/operations/application';

export class HandleReceivePixRefundEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository PixRefund repository.
   * @param paymentRepository Payment repository.
   * @param pixInfractionRefundOperationRepository Pix infraction refund operation repository.
   * @param refundEventEmitter PixRefund event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly repository: PixRefundRepository,
    private readonly infractionRepository: PixInfractionRepository,
    private readonly depositRepository: PixDepositRepository,
    private readonly devolutionReceivedRepository: PixDevolutionReceivedRepository,
    private readonly pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository,
    private readonly refundEventEmitter: PixRefundEventEmitter,
    private readonly operationService: OperationService,
    private readonly pixPaymentOperationCurrencyTag: string,
    private readonly pixPaymentOperationPixRefundTransactionTag: string,
  ) {
    this.logger = logger.child({
      context: HandleReceivePixRefundEventUseCase.name,
    });
  }

  /**
   * Receive an refund that was created by PSPGateway.
   *
   * @param id infraction id.
   * @param infraction related infraction.
   * @param contested contested.
   * @param amount amount to refund.
   * @param description description.
   * @param reason reason.
   * @param requesterBank requester bank.
   * @param responderBank responder bank.
   * @param status refund status.
   * @param transaction related transaction.
   * @returns Refund created.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {PixInfractionNotFoundException} Thrown when not has infraction associated.
   * @throws {PixInfractionInvalidStateException} Thrown when infraction has invalid state.
   * @throws {PixTransactionNotFoundException} Thrown when not has devolution received or deposit associated.
   */
  async execute(
    id: string,
    infractionPspId: string,
    contested: boolean,
    amount: number,
    description: string,
    reason: PixRefundReason,
    requesterBank: Bank,
    responderBank: Bank,
    status: PixRefundStatus,
    transaction: PixRefundTransaction,
    solicitationPspId: string,
  ): Promise<PixRefund> {
    // Data input check
    if (
      !id ||
      !amount ||
      !status ||
      !transaction?.endToEndId ||
      !solicitationPspId
    ) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!amount ? ['Amount'] : []),
        ...(!status ? ['Status'] : []),
        ...(!transaction ? ['Transaction'] : []),
        ...(!transaction?.endToEndId ? ['Transaction EndToEndId'] : []),
        ...(!solicitationPspId ? ['Solicitation ID'] : []),
      ]);
    }

    // Check if Refund's ID is available
    const checkPixRefund =
      await this.repository.getBySolicitationId(solicitationPspId);

    this.logger.debug('Check if refund exists.', {
      refund: checkPixRefund,
    });

    if (checkPixRefund) return checkPixRefund;

    //CheckStatus when receive refund
    if (status !== PixRefundStatus.OPEN) {
      throw new PixRefundInvalidStateException({ status });
    }

    const devolutionReceived =
      await this.devolutionReceivedRepository.getByEndToEndId(
        transaction.endToEndId,
      );
    const deposit = await this.depositRepository.getByEndToEndId(
      transaction.endToEndId,
    );

    this.logger.debug('Check if devolution or deposit exists.', {
      devolutionReceived,
      deposit,
    });

    if (!devolutionReceived && !deposit) {
      throw new PixTransactionNotFoundException({
        endToEndId: transaction.endToEndId,
      });
    }

    const transactionFound: PixRefundTransaction =
      deposit || devolutionReceived;

    const newRefund = new PixRefundEntity({
      id,
      state: PixRefundState.RECEIVE_PENDING,
      status,
      contested,
      description,
      amount,
      reason,
      requesterBank,
      responderBank,
      transactionType: deposit
        ? PixRefundTransactionType.DEPOSIT
        : PixRefundTransactionType.DEVOLUTION_RECEIVED,
      transaction: transactionFound,
      solicitationPspId,
    });

    if (infractionPspId) {
      const infractionFound = await this.getRelatedInfraction(infractionPspId);

      this.validateRelatedInfraction(infractionFound);

      infractionFound.state = PixInfractionState.REQUEST_REFUND_RECEIVED;
      newRefund.infraction = infractionFound;
      newRefund.operation = infractionFound.operation;

      await this.infractionRepository.update(infractionFound);

      await this.associateRefundToPixInfractionRefundOperation(
        newRefund,
        infractionFound,
      );
    } else {
      // Create block user balance operation
      newRefund.operation = new OperationEntity({ id: uuidV4() });
      await this.blockWalletAccountBalance(newRefund, transactionFound, amount);
    }

    // Save PixRefund
    await this.repository.create(newRefund);
    this.logger.debug('Created refund.', { newRefund });

    // Fire ReceivePendingPixRefundEvent
    this.refundEventEmitter.receivePendingPixRefund(newRefund);

    return newRefund;
  }

  private async getRelatedInfraction(
    infractionPspId: string,
  ): Promise<PixInfraction> {
    const foundPixInfraction =
      await this.infractionRepository.getByInfractionPspId(infractionPspId);

    this.logger.debug('Check if infraction exists.', {
      infraction: foundPixInfraction,
    });

    if (!foundPixInfraction) {
      throw new PixInfractionNotFoundException({
        infractionPspId,
      });
    }

    return foundPixInfraction;
  }

  private validateRelatedInfraction(infraction: PixInfraction): void {
    this.logger.debug('Check if infraction has valid state.', {
      infraction,
    });

    if (
      infraction.state !== PixInfractionState.CLOSED_CONFIRMED ||
      infraction.analysisResult !== PixInfractionAnalysisResultType.AGREED
    ) {
      throw new PixInfractionInvalidStateException(infraction);
    }

    this.logger.debug('Check if infraction was closed before 72 hours.', {
      infraction,
    });

    const limitDateToRequestRefund = getMoment(infraction.closingDate).add(
      3,
      'day',
    );

    if (getMoment().isAfter(limitDateToRequestRefund)) {
      throw new PixRefundLimitDateException({ infraction });
    }
  }

  private async associateRefundToPixInfractionRefundOperation(
    pixRefund: PixRefund,
    pixInfraction: PixInfraction,
  ): Promise<void> {
    // Check if infraction has any pix infraction refund operation.
    const filter: TGetPixInfractionRefundOperationFilter = {
      pixInfraction,
    };

    const pixInfractionRefundOperations =
      await this.pixInfractionRefundOperationRepository.getAllByFilter(filter);

    this.logger.debug('Pix infraction refund operations found.', {
      pixInfractionRefundOperations,
    });

    // Infraction is not associated to any refund operation.
    if (!pixInfractionRefundOperations?.length) return;

    for (const pixInfractionRefundOperation of pixInfractionRefundOperations) {
      // Save refund into pix infraction refund operation.

      pixInfractionRefundOperation.pixRefund = pixRefund;

      await this.pixInfractionRefundOperationRepository.update(
        pixInfractionRefundOperation,
      );

      this.logger.debug('Updated pix infraction refund operation.', {
        pixInfractionRefundOperation,
      });
    }
  }

  private async blockWalletAccountBalance(
    pixRefund: PixRefund,
    transaction: PixRefundTransaction,
    amount: number,
  ): Promise<void> {
    this.logger.debug('To block user wallet balance.', {
      operation: pixRefund.operation,
    });

    const originalOperation = await this.operationService.getOperationById(
      transaction.operation.id,
    );

    this.logger.debug('Original operation found.', { originalOperation });

    if (!originalOperation) {
      throw new OperationNotFoundException(transaction.operation.id);
    }

    const newOperation = new OperationEntity({
      id: pixRefund.operation.id,
      rawValue: amount,
      currency: new CurrencyEntity({
        tag: this.pixPaymentOperationCurrencyTag,
      }),
      description: this.pixPaymentOperationPixRefundTransactionTag,
    });
    const ownerAllowAvailableRawValue = true;

    const createOperationResponse = await this.operationService.createOperation(
      this.pixPaymentOperationPixRefundTransactionTag,
      newOperation,
      transaction.wallet,
      null,
      ownerAllowAvailableRawValue,
    );

    this.logger.debug('Created new operation to block wallet balance.', {
      createOperationResponse,
    });

    if (!createOperationResponse) {
      return;
    }

    const refundOperation = new OperationEntity({
      id: createOperationResponse.owner.id,
      value: createOperationResponse.owner.value,
    });

    const pixInfractionRefundOperation = new PixInfractionRefundOperationEntity(
      {
        id: uuidV4(),
        state: PixInfractionRefundOperationState.OPEN,
        user: transaction.user,
        pixRefund,
        originalOperation,
        refundOperation,
      },
    );

    await this.pixInfractionRefundOperationRepository.create(
      pixInfractionRefundOperation,
    );

    this.logger.debug('Created new pix infraction refund operation.', {
      pixInfractionRefundOperation,
    });
  }
}
