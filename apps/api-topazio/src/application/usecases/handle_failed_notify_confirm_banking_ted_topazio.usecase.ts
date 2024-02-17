import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import {
  NotifyStateType,
  NotifyConfirmBankingTed,
  NotifyConfirmBankingTedRepository,
} from '@zro/api-topazio/domain';
import { NotifyConfirmBankingTedEventEmitter } from '@zro/api-topazio/application';

export class HandleFailedNotifyConfirmBankingTedTopazioEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param notifyConfirmBankingTedRepository repository.
   * @param notifyConfirmBankingTedEventEmitter bankingTed emitter.
   */
  constructor(
    private logger: Logger,
    private readonly notifyConfirmBankingTedRepository: NotifyConfirmBankingTedRepository,
    private readonly notifyConfirmBankingTedEventEmitter: NotifyConfirmBankingTedEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandleFailedNotifyConfirmBankingTedTopazioEventUseCase.name,
    });
  }

  /**
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(payload: NotifyConfirmBankingTed): Promise<void> {
    this.logger.debug('Notify confirm banking ted received.', { payload });

    // Save all notify in database
    payload.id = uuidV4();
    payload.state = NotifyStateType.ERROR;
    const result = await this.notifyConfirmBankingTedRepository.create(payload);

    this.logger.debug('Notify error created.', { result });

    this.notifyConfirmBankingTedEventEmitter.errorNotifyConfirmBankingTed(
      result,
    );
  }
}
