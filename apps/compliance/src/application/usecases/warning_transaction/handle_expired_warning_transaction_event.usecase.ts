import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  WarningTransaction,
  WarningTransactionRepository,
  WarningTransactionStatus,
} from '@zro/compliance/domain';
import {
  WarningTransactionNotFoundException,
  WarningTransactionGateway,
  UpdateWarningTransactionStatusToClosedIssueRequest,
  WarningTransactionEventEmitter,
} from '@zro/compliance/application';

export class HandleExpiredWarningTransactionEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param warningTransactionRepository WarningTransaction repository.
   * @param warningTransactionGateway WarningTransaction gateway.
   * @param eventEmitter WarningTransaction event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly warningTransactionRepository: WarningTransactionRepository,
    private readonly warningTransactionGateway: WarningTransactionGateway,
    private readonly eventEmitter: WarningTransactionEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandleExpiredWarningTransactionEventUseCase.name,
    });
  }

  /**
   * Handler triggered when WarningTransaction expired.
   *
   * @param id WarningTransaction ID.
   * @returns WarningTransaction.
   */
  async execute(id: string): Promise<WarningTransaction> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Get WarningTransaction by ID
    const warningTransaction =
      await this.warningTransactionRepository.getById(id);

    this.logger.debug('WarningTransaction found.', { warningTransaction });

    if (!warningTransaction) {
      throw new WarningTransactionNotFoundException({ id });
    }

    // Indepotent
    if (warningTransaction.status !== WarningTransactionStatus.CLOSED) {
      return warningTransaction;
    }

    const payload: UpdateWarningTransactionStatusToClosedIssueRequest = {
      issueId: warningTransaction.issueId,
      status: warningTransaction.status,
    };

    await this.warningTransactionGateway.updateWarningTransactionStatusToClosed(
      payload,
    );

    this.eventEmitter.closedWarningTransaction(warningTransaction);

    this.logger.debug('Updated warning transaction issue to CLOSED status.', {
      warningTransaction,
    });

    return warningTransaction;
  }
}
