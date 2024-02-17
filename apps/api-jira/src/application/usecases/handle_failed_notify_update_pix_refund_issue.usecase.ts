import { Logger } from 'winston';
import {
  NotifyStateType,
  NotifyPixRefundIssue,
  NotifyPixRefundIssueRepository,
  NotifyEventType,
} from '@zro/api-jira/domain';
import { NotifyPixRefundIssueEventEmitter } from '@zro/api-jira/application';

export class HandleFailedNotifyUpdatePixRefundIssueEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param notifyIssueRepository repository.
   * @param notifyIssueEmitter Payment service.
   */
  constructor(
    private logger: Logger,
    private readonly notifyIssueRepository: NotifyPixRefundIssueRepository,
    private readonly notifyIssueEmitter: NotifyPixRefundIssueEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandleFailedNotifyUpdatePixRefundIssueEventUseCase.name,
    });
  }

  /**
   * Notify issue and send to pixPayment.
   *
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(payload: NotifyPixRefundIssue): Promise<void> {
    this.logger.debug('Notify issue received.', { payload });

    // update all notify in database
    payload.state = NotifyStateType.ERROR;
    payload.eventType = NotifyEventType.UPDATED;
    const result = await this.notifyIssueRepository.create(payload);

    this.logger.debug('Notify updated.', { result });

    this.notifyIssueEmitter.errorNotifyIssue(result);
  }
}
