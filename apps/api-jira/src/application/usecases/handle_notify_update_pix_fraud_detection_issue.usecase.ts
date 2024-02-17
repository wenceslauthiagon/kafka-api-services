import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  NotifyPixFraudDetectionIssueEntity,
  NotifyPixFraudDetectionIssueRepository,
  NotifyStateType,
  NotifyEventType,
} from '@zro/api-jira/domain';
import {
  PixFraudDetectionEntity,
  PixFraudDetectionStatus,
} from '@zro/pix-payments/domain';
import {
  PixPaymentService,
  NotifyPixFraudDetectionIssueInvalidStatusException,
} from '@zro/api-jira/application';

export class HandleNotifyUpdatePixFraudDetectionIssueEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param notifyIssueRepository Global logger instance.
   * @param pixPaymentService PixFraudDetection service.
   */
  constructor(
    private logger: Logger,
    private readonly notifyIssueRepository: NotifyPixFraudDetectionIssueRepository,
    private readonly pixPaymentService: PixPaymentService,
  ) {
    this.logger = logger.child({
      context: HandleNotifyUpdatePixFraudDetectionIssueEventUseCase.name,
    });
  }

  /**
   * Notify update and send to pixPayment.
   *
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(payload: NotifyPixFraudDetectionIssueEntity): Promise<void> {
    this.logger.debug('Notify update received.', { payload });

    const { issueId, document, fraudType, summary, status } = payload;

    if (!issueId || !document || !fraudType || !summary || !status) {
      throw new MissingDataException([
        ...(!issueId ? ['Issue ID'] : []),
        ...(!document ? ['Document'] : []),
        ...(!fraudType ? ['Fraud type'] : []),
        ...(!summary ? ['Summary'] : []),
        ...(!status ? ['Status'] : []),
      ]);
    }

    // Check indepotent
    const notifyPixFraudDetectionIssue =
      await this.notifyIssueRepository.getByIssueIdAndStatus(issueId, status);

    if (notifyPixFraudDetectionIssue) {
      return;
    }

    // Save all notify in database
    payload.state = NotifyStateType.READY;
    payload.eventType = NotifyEventType.UPDATED;

    await this.notifyIssueRepository.create(payload);

    switch (payload.status) {
      case PixFraudDetectionStatus.REGISTERED:
        return this.handleRegisteredPixFraudDetection(payload);

      case PixFraudDetectionStatus.CANCELED_REGISTERED:
        return this.handleCanceledRegisteredPixFraudDetection(payload);

      default:
        this.logger.error('Invalid pix fraud detection status', { payload });
        throw new NotifyPixFraudDetectionIssueInvalidStatusException(payload);
    }
  }

  private async handleRegisteredPixFraudDetection(
    payload: NotifyPixFraudDetectionIssueEntity,
  ) {
    const data = new PixFraudDetectionEntity({
      id: uuidV4(),
      issueId: payload.issueId,
      document: payload.document,
      fraudType: payload.fraudType,
      key: payload.key,
    });

    await this.pixPaymentService.registerPixFraudDetection(data);

    this.logger.debug('Registered pix fraud detection.', {
      data,
    });
  }

  private async handleCanceledRegisteredPixFraudDetection(
    payload: NotifyPixFraudDetectionIssueEntity,
  ) {
    const data = new PixFraudDetectionEntity({
      issueId: payload.issueId,
    });

    await this.pixPaymentService.cancelRegisteredPixFraudDetection(data);

    this.logger.debug('Canceled registered pix fraud detection.', {
      data,
    });
  }
}
