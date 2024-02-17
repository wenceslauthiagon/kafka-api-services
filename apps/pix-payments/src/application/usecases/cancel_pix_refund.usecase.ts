import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  PixRefund,
  PixRefundRepository,
  PixRefundState,
  PixRefundStatus,
  PixRefundRejectionReason,
  PixInfractionRefundOperationState,
  TGetPixInfractionRefundOperationFilter,
  PixInfractionRefundOperationRepository,
} from '@zro/pix-payments/domain';
import {
  PixRefundEventEmitter,
  PixRefundNotFoundException,
  OperationService,
} from '@zro/pix-payments/application';

export class CancelPixRefundUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository PixRefund repository.
   * @param pixInfractionRefundOperationRepository Pix infraction refund operation repository.
   * @param refundEventEmitter PixRefund event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly repository: PixRefundRepository,
    private readonly pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository,
    private readonly refundEventEmitter: PixRefundEventEmitter,
    private readonly operationService: OperationService,
  ) {
    this.logger = logger.child({ context: CancelPixRefundUseCase.name });
  }

  /**
   * Cancel refund.
   *
   * @param id refund id.
   * @returns {PixRefund} PixRefund created.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    issueId: number,
    analisysDetails: string,
    rejectionReason: PixRefundRejectionReason,
  ): Promise<PixRefund> {
    // Data input check
    if (!issueId) {
      throw new MissingDataException(['Issue ID']);
    }

    // Check if PixRefund's is available
    const pixRefund = await this.repository.getByIssueId(issueId);

    this.logger.debug('Check if refund exists.', { refund: pixRefund });

    if (!pixRefund) {
      throw new PixRefundNotFoundException({ issueId });
    }

    // Indepotent
    if (pixRefund.state === PixRefundState.CANCEL_PENDING) {
      return pixRefund;
    }

    pixRefund.state = PixRefundState.CANCEL_PENDING;
    pixRefund.status = PixRefundStatus.CANCELLED;
    pixRefund.analysisDetails = analisysDetails;
    pixRefund.rejectionReason = rejectionReason;

    // Update PixRefund
    await this.repository.update(pixRefund);

    this.logger.debug('updated refund.', { pixRefund });

    // Revert pix infraction refund operations, if they exist.
    await this.revertRefundOperations(pixRefund);

    this.refundEventEmitter.cancelPendingPixRefund(pixRefund);

    return pixRefund;
  }

  private async revertRefundOperations(pixRefund: PixRefund): Promise<void> {
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
