import { Logger } from 'winston';
import {
  NotifyUserWithdrawSettingRequestIssueRepository,
  NotifyUserWithdrawSettingRequestIssue,
  NotifyStateType,
  NotifyEventType,
} from '@zro/api-jira/domain';

export class HandleFailedNotifyUpdateUserWithdrawSettingRequestIssueEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param notifyIssueRepository repository.
   */
  constructor(
    private logger: Logger,
    private readonly notifyIssueRepository: NotifyUserWithdrawSettingRequestIssueRepository,
  ) {
    this.logger = logger.child({
      context:
        HandleFailedNotifyUpdateUserWithdrawSettingRequestIssueEventUseCase.name,
    });
  }

  /**
   * Notify issue and emit error.
   *
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(payload: NotifyUserWithdrawSettingRequestIssue): Promise<void> {
    this.logger.debug('Notify issue received.', { payload });

    // update all notify in database
    payload.state = NotifyStateType.ERROR;
    payload.eventType = NotifyEventType.UPDATED;

    const result = await this.notifyIssueRepository.create(payload);

    this.logger.debug('Notify updated.', { result });
  }
}
