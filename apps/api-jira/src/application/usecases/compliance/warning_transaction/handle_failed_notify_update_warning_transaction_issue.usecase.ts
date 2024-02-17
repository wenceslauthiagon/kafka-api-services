import { Logger } from 'winston';
import {
  NotifyWarningTransactionIssueRepository,
  NotifyWarningTransactionIssue,
  NotifyStateType,
  NotifyEventType,
} from '@zro/api-jira/domain';
import { NotifyWarningTransactionIssueEventEmitter } from '@zro/api-jira/application';

export class HandleFailedNotifyUpdateWarningTransactionIssueEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param notifyIssueRepository repository.
   * @param notifyIssueEmitter emitter.
   */
  constructor(
    private logger: Logger,
    private readonly notifyIssueRepository: NotifyWarningTransactionIssueRepository,
    private readonly notifyIssueEmitter: NotifyWarningTransactionIssueEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandleFailedNotifyUpdateWarningTransactionIssueEventUseCase.name,
    });
  }

  /**
   * Notify issue and emit error.
   *
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(payload: NotifyWarningTransactionIssue): Promise<void> {
    this.logger.debug('Notify issue received.', { payload });

    // update all notify in database
    payload.state = NotifyStateType.ERROR;
    payload.eventType = NotifyEventType.UPDATED;

    const result = await this.notifyIssueRepository.create(payload);

    this.logger.debug('Notify updated.', { result });

    this.notifyIssueEmitter.errorNotifyIssue(result);
  }
}
