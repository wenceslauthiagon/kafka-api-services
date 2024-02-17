import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import {
  NotifyStateType,
  NotifyCompletion,
  NotifyCompletionRepository,
} from '@zro/api-topazio/domain';
import { NotifyCompletionEventEmitter } from '@zro/api-topazio/application';

export class HandleFailedNotifyCompletionTopazioEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param notifyCompletionRepository repository.
   * @param notifyCompletionEmitter Payment service.
   */
  constructor(
    private logger: Logger,
    private readonly notifyCompletionRepository: NotifyCompletionRepository,
    private readonly notifyCompletionEmitter: NotifyCompletionEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandleFailedNotifyCompletionTopazioEventUseCase.name,
    });
  }

  /**
   * Notify completion and send to pixPayment.
   *
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(payload: NotifyCompletion): Promise<void> {
    this.logger.debug('Notify completion received.', { payload });

    // Save all notify in database
    payload.id = uuidV4();
    payload.state = NotifyStateType.ERROR;
    const result = await this.notifyCompletionRepository.create(payload);

    this.logger.debug('Notify created.', { result });

    this.notifyCompletionEmitter.errorNotifyCompletion(result);
  }
}
