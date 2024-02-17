import { Logger } from 'winston';
import {
  NotifyStateType,
  NotifyPixInfractionIssue,
  NotifyPixInfractionIssueRepository,
  NotifyEventType,
} from '@zro/api-jira/domain';
import { NotifyPixInfractionIssueEventEmitter } from '@zro/api-jira/application';

export class HandleFailedNotifyCreatePixInfractionIssueEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param notifyIssueRepository repository.
   * @param notifyIssueEmitter Payment service.
   */
  constructor(
    private logger: Logger,
    private readonly notifyIssueRepository: NotifyPixInfractionIssueRepository,
    private readonly notifyIssueEmitter: NotifyPixInfractionIssueEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandleFailedNotifyCreatePixInfractionIssueEventUseCase.name,
    });
  }

  /**
   * Notify issue and send to pixPayment.
   *
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(payload: NotifyPixInfractionIssue): Promise<void> {
    this.logger.debug('Notify issue received.', { payload });

    // Save all notify in database
    payload.state = NotifyStateType.ERROR;
    payload.eventType = NotifyEventType.CREATED;
    const result = await this.notifyIssueRepository.create(payload);

    this.logger.debug('Notify created.', { result });

    this.notifyIssueEmitter.errorNotifyIssue(result);
  }
}
