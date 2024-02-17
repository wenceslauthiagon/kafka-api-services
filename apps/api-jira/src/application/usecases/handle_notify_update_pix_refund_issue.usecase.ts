import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  NotifyPixRefundIssueEntity,
  NotifyPixRefundIssueRepository,
  NotifyStateType,
  NotifyEventType,
} from '@zro/api-jira/domain';
import { PixRefundEntity, PixRefundStatus } from '@zro/pix-payments/domain';
import {
  PixPaymentService,
  NotifyPixRefundIssueInvalidStatusException,
} from '@zro/api-jira/application';

export class HandleNotifyUpdatePixRefundIssueEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param notifyIssueRepository Global logger instance.
   * @param pixPaymentService Refund service.
   */
  constructor(
    private logger: Logger,
    private readonly notifyIssueRepository: NotifyPixRefundIssueRepository,
    private readonly pixPaymentService: PixPaymentService,
  ) {
    this.logger = logger.child({
      context: HandleNotifyUpdatePixRefundIssueEventUseCase.name,
    });
  }

  /**
   * Notify update and send to pixPayment.
   *
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(payload: NotifyPixRefundIssueEntity): Promise<void> {
    this.logger.debug('Notify update received.', { payload });

    const { issueId, summary, operationId, status } = payload;

    if (!issueId || !summary || !operationId || !status) {
      throw new MissingDataException([
        ...(!issueId ? ['Issue ID'] : []),
        ...(!operationId ? ['Operation ID'] : []),
        ...(!summary ? ['Summary'] : []),
        ...(!status ? ['Status'] : []),
      ]);
    }

    // Check indepotent
    const notifyPixRefundIssue =
      await this.notifyIssueRepository.getByIssueIdAndStatus(issueId, status);

    if (notifyPixRefundIssue) {
      return;
    }

    // Save all notify in database
    payload.state = NotifyStateType.READY;
    payload.eventType = NotifyEventType.UPDATED;

    await this.notifyIssueRepository.create(payload);

    switch (payload.status) {
      case PixRefundStatus.CLOSED:
        return this.handleClosedRefund(payload);

      case PixRefundStatus.CANCELLED:
        return this.handleCanceledRefund(payload);

      default:
        this.logger.error('Invalid refund status', { payload });
        throw new NotifyPixRefundIssueInvalidStatusException(payload);
    }
  }

  private async handleClosedRefund(payload: NotifyPixRefundIssueEntity) {
    const data = new PixRefundEntity({
      issueId: payload.issueId,
      analysisDetails: payload.analysisDetails,
    });

    const refund = await this.pixPaymentService.closePixRefund(data);
    this.logger.debug('Closed refund.', { refund });
  }

  private async handleCanceledRefund(payload: NotifyPixRefundIssueEntity) {
    const data = new PixRefundEntity({
      issueId: payload.issueId,
      analysisDetails: payload.analysisDetails,
      rejectionReason: payload.rejectionReason,
    });

    const refund = await this.pixPaymentService.cancelPixRefund(data);
    this.logger.debug('Canceled refund.', { refund });
  }
}
