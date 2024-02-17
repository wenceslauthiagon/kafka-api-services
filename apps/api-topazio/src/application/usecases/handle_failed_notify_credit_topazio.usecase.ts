import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import {
  NotifyStateType,
  NotifyCredit,
  NotifyCreditRepository,
} from '@zro/api-topazio/domain';
import { NotifyCreditEventEmitter } from '@zro/api-topazio/application';

export class HandleFailedNotifyCreditTopazioEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param notifyCreditRepository repository.
   * @param notifyCreditEmitter Payment service.
   */
  constructor(
    private logger: Logger,
    private readonly notifyCreditRepository: NotifyCreditRepository,
    private readonly notifyCreditEmitter: NotifyCreditEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandleFailedNotifyCreditTopazioEventUseCase.name,
    });
  }

  /**
   * Notify credit and send to pixPayment.
   *
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(payload: NotifyCredit): Promise<void> {
    this.logger.debug('Notify credit received.', { payload });

    // Save all notify in database
    payload.id = uuidV4();
    payload.state = NotifyStateType.ERROR;
    const result = await this.notifyCreditRepository.create(payload);

    this.logger.debug('Notify created.', { result });

    this.notifyCreditEmitter.errorNotifyCredit(result);
  }
}
