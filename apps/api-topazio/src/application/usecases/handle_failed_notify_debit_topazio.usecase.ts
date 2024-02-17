import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import {
  NotifyStateType,
  NotifyDebit,
  NotifyDebitRepository,
} from '@zro/api-topazio/domain';
import { NotifyDebitEventEmitter } from '@zro/api-topazio/application';

export class HandleFailedNotifyDebitTopazioEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param notifyDebitRepository repository.
   * @param notifyDebitEmitter Payment service.
   */
  constructor(
    private logger: Logger,
    private readonly notifyDebitRepository: NotifyDebitRepository,
    private readonly notifyDebitEmitter: NotifyDebitEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandleFailedNotifyDebitTopazioEventUseCase.name,
    });
  }

  /**
   * Notify debit and send to pixPayment.
   *
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(payload: NotifyDebit): Promise<void> {
    this.logger.debug('Notify debit received.', { payload });

    // Save all notify in database
    payload.id = uuidV4();
    payload.state = NotifyStateType.ERROR;
    const result = await this.notifyDebitRepository.create(payload);

    this.logger.debug('Notify created.', { result });

    this.notifyDebitEmitter.errorNotifyDebit(result);
  }
}
