import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import {
  NotifyStateType,
  NotifyRegisterBankingTed,
  NotifyRegisterBankingTedRepository,
} from '@zro/api-topazio/domain';
import { NotifyRegisterBankingTedEventEmitter } from '@zro/api-topazio/application';

export class HandleFailedNotifyRegisterBankingTedTopazioEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param notifyRegisterBankingTedRepository repository.
   * @param notifyRegisterBankingTedEventEmitter bankingTed emitter.
   */
  constructor(
    private logger: Logger,
    private readonly notifyRegisterBankingTedRepository: NotifyRegisterBankingTedRepository,
    private readonly notifyRegisterBankingTedEventEmitter: NotifyRegisterBankingTedEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandleFailedNotifyRegisterBankingTedTopazioEventUseCase.name,
    });
  }

  /**
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(payload: NotifyRegisterBankingTed): Promise<void> {
    this.logger.debug('Notify completion banking ted received.', { payload });

    // Save all notify in database
    payload.id = uuidV4();
    payload.state = NotifyStateType.ERROR;
    const result =
      await this.notifyRegisterBankingTedRepository.create(payload);

    this.logger.debug('Notify error created.', { result });

    this.notifyRegisterBankingTedEventEmitter.errorNotifyRegisterBankingTed(
      result,
    );
  }
}
