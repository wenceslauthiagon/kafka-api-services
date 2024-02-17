import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { MissingDataException } from '@zro/common';
import {
  PixInfraction,
  PixInfractionEntity,
  PixInfractionRepository,
  PixInfractionState,
  PixInfractionStatus,
  PixInfractionType,
  PixInfractionReport,
  PixDepositRepository,
  PixDevolutionReceivedRepository,
  PixInfractionTransactionType,
  PixInfractionTransaction,
  PixInfractionRefundOperationEntity,
  PixInfractionRefundOperationState,
  PixInfractionRefundOperationRepository,
} from '@zro/pix-payments/domain';
import {
  CurrencyEntity,
  Operation,
  OperationEntity,
} from '@zro/operations/domain';
import {
  PixInfractionEventEmitter,
  PixTransactionNotFoundException,
  PixInfractionInvalidStateException,
  OperationService,
} from '@zro/pix-payments/application';
import { OperationNotFoundException } from '@zro/operations/application';

export class HandleReceivePixInfractionEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository Infraction repository.
   * @param depositRepository Deposit repository.
   * @param devolutionReceivedRepository Devolution Received repository.
   * @param infractionEventEmitter Infraction event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly repository: PixInfractionRepository,
    private readonly depositRepository: PixDepositRepository,
    private readonly devolutionReceivedRepository: PixDevolutionReceivedRepository,
    private readonly pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository,
    private readonly infractionEventEmitter: PixInfractionEventEmitter,
    private readonly operationService: OperationService,
    private readonly pixPaymentOperationCurrencyTag: string,
    private readonly pixPaymentOperationRefundTransactionTag: string,
  ) {
    this.logger = logger.child({
      context: HandleReceivePixInfractionEventUseCase.name,
    });
  }

  /**
   * Receive an infraction that was created by PSPGateway.
   *
   * @param id infraction id.
   * @param payment related payment.
   * @param creationDate creation date.
   * @param reportDetails report details.
   * @param endToEndId end to end id.
   * @param infractionPspId infraction psp id.
   * @param infractionType infraction type.
   * @param isReporter is reporter.
   * @param ispb ispb.
   * @param ispbCreditedParticipant ispb credited participant.
   * @param ispbDebitedParticipant ispb debited participant.
   * @param lastChangeDate last change date.
   * @param reportBy report by.
   * @param status status.
   * @returns Infraction created.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    id: string,
    creationDate: Date,
    reportDetails: string,
    endToEndId: string,
    infractionPspId: string,
    infractionType: PixInfractionType,
    isReporter: boolean,
    ispb: string,
    ispbCreditedParticipant: string,
    ispbDebitedParticipant: string,
    lastChangeDate: Date,
    reportBy: PixInfractionReport,
    status: PixInfractionStatus,
    operationTransactionId?: string,
  ): Promise<PixInfraction> {
    // Data input check
    if (
      !id ||
      !endToEndId ||
      !infractionPspId ||
      !infractionType ||
      !lastChangeDate ||
      !creationDate
    ) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!endToEndId ? ['End To End ID'] : []),
        ...(!infractionPspId ? ['Infraction PSP ID'] : []),
        ...(!infractionType ? ['Infraction Type'] : []),
        ...(!creationDate ? ['Create Change Date'] : []),
        ...(!lastChangeDate ? ['Last Change Date'] : []),
      ]);
    }

    // Check if Infraction's ID is available
    const checkInfraction =
      await this.repository.getByInfractionPspId(infractionPspId);

    this.logger.debug('Check if infraction exists.', {
      infraction: checkInfraction,
    });

    if (checkInfraction) return checkInfraction;

    //CheckStatus when receive refund
    if (status !== PixInfractionStatus.ACKNOWLEDGED) {
      throw new PixInfractionInvalidStateException({ status });
    }

    const devolutionReceived =
      (operationTransactionId || endToEndId) &&
      (await this.devolutionReceivedRepository.getByIdOrEndToEndId(
        operationTransactionId,
        endToEndId,
      ));

    this.logger.debug('Devolution received found.', {
      devolutionReceived,
    });

    const deposit =
      (operationTransactionId || endToEndId) &&
      (await this.depositRepository.getByIdOrEndToEndId(
        operationTransactionId,
        endToEndId,
      ));

    this.logger.debug('Deposit found.', {
      deposit,
    });

    this.logger.debug('Check if devolution or deposit exists.', {
      devolutionReceived,
      deposit,
    });

    if (!devolutionReceived && !deposit) {
      throw new PixTransactionNotFoundException({
        id: operationTransactionId,
      });
    }

    const transaction: PixInfractionTransaction = deposit || devolutionReceived;

    const operation =
      infractionType === PixInfractionType.REFUND_REQUEST
        ? new OperationEntity({ id: uuidV4() })
        : null;

    const newInfraction = new PixInfractionEntity({
      id,
      state: PixInfractionState.RECEIVE_PENDING,
      operation,
      description: reportDetails,
      transaction,
      transactionType: deposit
        ? PixInfractionTransactionType.DEPOSIT
        : PixInfractionTransactionType.DEVOLUTION_RECEIVED,
      creationDate,
      endToEndId,
      infractionPspId,
      infractionType,
      isReporter,
      ispb,
      ispbCreditedParticipant,
      ispbDebitedParticipant,
      lastChangeDate,
      reportBy,
      status,
    });

    // Save Infraction
    await this.repository.create(newInfraction);
    this.logger.debug('Created infraction.', { newInfraction });

    // Create block user balance operation
    if (operation) {
      await this.blockWalletAccountBalance(operation, newInfraction);
    }

    // Fire ReceivePendingInfractionEvent
    this.infractionEventEmitter.receivePendingInfraction(newInfraction);

    return newInfraction;
  }

  async blockWalletAccountBalance(
    operation: Operation,
    infraction: PixInfraction,
  ): Promise<void> {
    this.logger.debug('To block user wallet balance.', { operation });

    const originalOperation = await this.operationService.getOperationById(
      infraction.transaction.operation.id,
    );

    this.logger.debug('Original operation found.', { originalOperation });

    if (!originalOperation) {
      throw new OperationNotFoundException(infraction.transaction.operation.id);
    }

    const newOperation = new OperationEntity({
      id: operation.id,
      rawValue: originalOperation.value,
      currency: new CurrencyEntity({
        tag: this.pixPaymentOperationCurrencyTag,
      }),
      description: this.pixPaymentOperationRefundTransactionTag,
    });
    const ownerAllowAvailableRawValue = true;

    const createOperationResponse = await this.operationService.createOperation(
      this.pixPaymentOperationRefundTransactionTag,
      newOperation,
      infraction.transaction.wallet,
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
        user: infraction.transaction.user,
        pixInfraction: infraction,
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
