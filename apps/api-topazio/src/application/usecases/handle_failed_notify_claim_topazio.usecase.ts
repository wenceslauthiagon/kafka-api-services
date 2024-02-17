import { Logger } from 'winston';
import {
  NotifyStateType,
  NotifyClaim,
  NotifyClaimRepository,
} from '@zro/api-topazio/domain';
import { NotifyClaimEventEmitter } from '@zro/api-topazio/application';

export class HandleFailedNotifyClaimTopazioEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param notifyClaimRepository repository.
   * @param notifyClaimEmitter Payment service.
   */
  constructor(
    private logger: Logger,
    private readonly notifyClaimRepository: NotifyClaimRepository,
    private readonly notifyClaimEmitter: NotifyClaimEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandleFailedNotifyClaimTopazioEventUseCase.name,
    });
  }

  /**
   * Notify claim and send to pixPayment.
   *
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(payload: NotifyClaim): Promise<void> {
    this.logger.debug('Notify claim received.', { payload });

    // Save all notify in database
    payload.state = NotifyStateType.ERROR;
    const result = await this.notifyClaimRepository.create(payload);

    this.logger.debug('Notify created.', { result });

    this.notifyClaimEmitter.errorNotifyClaim(result);
  }
}
