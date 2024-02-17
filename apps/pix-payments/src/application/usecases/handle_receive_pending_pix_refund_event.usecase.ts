import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  PixRefund,
  PixRefundState,
  PixRefundTransactionType,
  PixDepositRepository,
  PixDevolutionReceivedRepository,
  PixRefundRepository,
  PixDevolutionReceived,
  PixDeposit,
  PixRefundStatus,
} from '@zro/pix-payments/domain';
import {
  CreateRefundIssueRequest,
  UpdateRefundStatusIssueRefundRequest,
  PixRefundEventEmitter,
  IssueRefundGateway,
  PixRefundNotFoundException,
  PixTransactionNotFoundException,
  PixRefundInvalidStateException,
} from '@zro/pix-payments/application';

export class HandleReceivePendingPixRefundUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository PixRefund repository.
   * @param issueGateway Issue Refund Gateway.
   * @param eventEmitter PixRefund event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly repository: PixRefundRepository,
    private readonly depositRepository: PixDepositRepository,
    private readonly devolutionReceivedRepository: PixDevolutionReceivedRepository,
    private readonly issueGateway: IssueRefundGateway,
    private readonly eventEmitter: PixRefundEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandleReceivePendingPixRefundUseCase.name,
    });
  }

  /**
   * Receive pending refund and create on refund gateway.
   *
   * @param id refund id.
   * @returns {PixRefund} PixRefund updated.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {PixRefundNotFoundException} Thrown when pix refund not exists.
   */
  async execute(id: string): Promise<PixRefund> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Get refund by id
    const refund = await this.repository.getById(id);

    this.logger.debug('Found refund.', { refund });

    if (!refund) {
      throw new PixRefundNotFoundException({ id });
    }

    // Indepotent
    if (refund.state === PixRefundState.RECEIVE_CONFIRMED) {
      return refund;
    }

    // RECEIVE PENDING AND ERROR states is accept.
    // ERROR state is accepted because after error observer is called again.
    if (
      ![PixRefundState.RECEIVE_PENDING, PixRefundState.ERROR].includes(
        refund.state,
      )
    ) {
      throw new PixRefundInvalidStateException(refund);
    }

    //Get originalTransaction
    let originalTransaction: PixDeposit | PixDevolutionReceived;
    if (refund.transactionType === PixRefundTransactionType.DEPOSIT) {
      originalTransaction = await this.depositRepository.getById(
        refund.transaction.id,
      );

      this.logger.debug('Found pixDeposit.', { deposit: originalTransaction });
    } else {
      originalTransaction = await this.devolutionReceivedRepository.getById(
        refund.transaction.id,
      );

      this.logger.debug('Found pixDevolutionReceived.', {
        devolutionReceived: originalTransaction,
      });
    }

    if (!originalTransaction) {
      throw new PixTransactionNotFoundException(originalTransaction);
    }
    refund.transaction = originalTransaction;

    // create issue
    const createRefundIssueRequest: CreateRefundIssueRequest = {
      clientName: refund.transaction?.clientName,
      endToEndId: refund.transaction.endToEndId,
      amount: refund.amount,
      description: refund.description,
      reason: refund.reason,
      operation: refund.transaction.operation,
    };

    const result = await this.issueGateway.createRefund(
      createRefundIssueRequest,
    );

    this.logger.debug('Created Refund on issueGateway.', { result });

    const refundStatusUpdateRequest: UpdateRefundStatusIssueRefundRequest = {
      issueId: result.issueId,
      status: PixRefundStatus.RECEIVED,
    };

    await this.issueGateway.updateRefundStatus(refundStatusUpdateRequest);

    this.logger.debug('Created refund was updated status on issueGateway.', {
      refundStatusUpdateRequest,
    });

    refund.issueId = result.issueId;
    refund.state = PixRefundState.RECEIVE_CONFIRMED;

    // Update infraction
    await this.repository.update(refund);

    this.logger.debug('Updated received infraction.', { refund });

    // Fire ReceiveConfirmedPixRefundEvent
    this.eventEmitter.receiveConfirmedPixRefund(refund);

    return refund;
  }
}
