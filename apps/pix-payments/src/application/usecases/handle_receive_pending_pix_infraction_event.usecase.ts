import { Logger } from 'winston';
import { MissingDataException, getMoment } from '@zro/common';
import {
  PixDeposit,
  PixDepositRepository,
  PixDevolutionReceived,
  PixDevolutionReceivedRepository,
  PixInfraction,
  PixInfractionRepository,
  PixInfractionState,
  PixInfractionStatus,
  PixInfractionTransactionType,
} from '@zro/pix-payments/domain';
import {
  CreateInfractionIssueInfractionRequest,
  UpdateInfractionIssueInfractionRequest,
  UpdateInfractionStatusIssueInfractionRequest,
  PixInfractionEventEmitter,
  IssueInfractionGateway,
  PixInfractionNotFoundException,
  PixInfractionInvalidStateException,
  PixTransactionNotFoundException,
} from '@zro/pix-payments/application';

export class HandleReceivePendingPixInfractionEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository Infraction repository.
   * @param depositRepository Deposit repository.
   * @param devolutionReceivedRepository Devolution Received repository.
   * @param issueInfractionGateway Issue infraction gateway.
   * @param operationService Operation Service.
   * @param eventEmitter Infraction event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly repository: PixInfractionRepository,
    private readonly depositRepository: PixDepositRepository,
    private readonly devolutionReceivedRepository: PixDevolutionReceivedRepository,
    private readonly issueInfractionGateway: IssueInfractionGateway,
    private readonly eventEmitter: PixInfractionEventEmitter,
    private readonly infractionDueDate: string,
  ) {
    this.logger = logger.child({
      context: HandleReceivePendingPixInfractionEventUseCase.name,
    });
  }

  /**
   * Receive pending infraction and create on infraction gateway.
   *
   * @param id infraction id.
   * @returns {PixInfraction} Infraction updated.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(id: string): Promise<PixInfraction> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Search infraction by id
    const infraction = await this.repository.getById(id);

    this.logger.debug('Found infraction.', { infraction });

    if (!infraction) {
      throw new PixInfractionNotFoundException({ id });
    }

    // Indepotent
    if (infraction.state === PixInfractionState.RECEIVE_CONFIRMED) {
      return infraction;
    }

    // RECEIVE RECEIVE_PENDING AND ERROR states is accept.
    // ERROR state is accepted because after error observer is called again.
    if (
      ![PixInfractionState.RECEIVE_PENDING, PixInfractionState.ERROR].includes(
        infraction.state,
      )
    ) {
      throw new PixInfractionInvalidStateException(infraction);
    }

    //Get originalTransaction
    let originalTransaction: PixDeposit | PixDevolutionReceived;
    if (infraction.transactionType === PixInfractionTransactionType.DEPOSIT) {
      originalTransaction = await this.depositRepository.getById(
        infraction.transaction.id,
      );

      this.logger.debug('Found pixDeposit.', { deposit: originalTransaction });
    } else {
      originalTransaction = await this.devolutionReceivedRepository.getById(
        infraction.transaction.id,
      );

      this.logger.debug('Found pixDevolutionReceived.', {
        devolutionReceived: originalTransaction,
      });
    }

    if (!originalTransaction) {
      throw new PixTransactionNotFoundException(originalTransaction);
    }
    infraction.transaction = originalTransaction;

    const infractionCreateRequest: CreateInfractionIssueInfractionRequest = {
      clientDocument: infraction.transaction?.clientDocument,
      description: infraction.description,
      operation: infraction.transaction.operation,
      infractionType: infraction.infractionType,
    };

    const result = await this.issueInfractionGateway.createInfraction(
      infractionCreateRequest,
    );

    this.logger.debug('Created Infraction on issueGateway.', { result });

    const infractionUpdateRequest: UpdateInfractionIssueInfractionRequest = {
      issueId: result.issueId,
      description: infraction.description,
      infractionPspId: infraction.infractionPspId,
      ispbDebitedParticipant: infraction.ispbDebitedParticipant,
      ispbCreditedParticipant: infraction.ispbCreditedParticipant,
      reportBy: infraction.reportBy,
      endToEndId: infraction.endToEndId,
      dueDate: getMoment()
        .add(this.infractionDueDate, 'days')
        .format('YYYY-MM-DD'),
    };

    await this.issueInfractionGateway.updateInfraction(infractionUpdateRequest);

    this.logger.debug('Created infraction was updated on issueGateway.', {
      infractionUpdateRequest,
    });

    const infractionStatusUpdateRequest: UpdateInfractionStatusIssueInfractionRequest =
      {
        issueId: result.issueId,
        status: PixInfractionStatus.RECEIVED,
      };

    await this.issueInfractionGateway.updateInfractionStatus(
      infractionStatusUpdateRequest,
    );

    this.logger.debug(
      'Created infraction was updated status on issueGateway.',
      {
        infractionStatusUpdateRequest,
      },
    );

    infraction.issueId = result.issueId;
    infraction.state = PixInfractionState.RECEIVE_CONFIRMED;

    // Update infraction
    await this.repository.update(infraction);

    this.logger.debug('Updated received infraction.', { infraction });

    // Fire ReceiveConfirmedInfractionEvent
    this.eventEmitter.receiveConfirmedInfraction(infraction);

    return infraction;
  }
}
