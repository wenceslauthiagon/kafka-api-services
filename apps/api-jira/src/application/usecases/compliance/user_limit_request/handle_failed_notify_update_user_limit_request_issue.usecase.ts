import { Logger } from 'winston';
import {
  NotifyUserLimitRequestIssue,
  NotifyUserLimitRequestIssueRepository,
  UserLimitRequestNotifyStateType,
  UserLimitRequestNotifyEventType,
} from '@zro/api-jira/domain';
import { NotifyUserLimitRequestIssueEventEmitter } from '@zro/api-jira/application';

export class HandleFailedNotifyUpdateUserLimitRequestIssueEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param notifyIssueRepository repository.
   * @param notifyIssueEmitter Payment service.
   */
  constructor(
    private logger: Logger,
    private readonly notifyIssueRepository: NotifyUserLimitRequestIssueRepository,
    private readonly notifyIssueEmitter: NotifyUserLimitRequestIssueEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandleFailedNotifyUpdateUserLimitRequestIssueEventUseCase.name,
    });
  }

  /**
   * Notify issue and send to pixPayment.
   *
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(payload: NotifyUserLimitRequestIssue): Promise<void> {
    this.logger.debug('Notify issue received.', { payload });

    // update all notify in database
    payload.state = UserLimitRequestNotifyStateType.ERROR;
    payload.eventType = UserLimitRequestNotifyEventType.UPDATED;

    const result = await this.notifyIssueRepository.create(payload);

    this.logger.debug('Notify updated.', { result });

    this.notifyIssueEmitter.errorNotifyIssue(result);
  }
}
