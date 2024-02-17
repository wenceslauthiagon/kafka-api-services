import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import {
  NotifyCreditDeposit,
  NotifyCreditDepositRepository,
  NotifyStateType,
} from '@zro/api-jdpi/domain';
import { NotifyCreditDepositEventEmitter } from '@zro/api-jdpi/application';

export class HandleFailedNotifyCreditDepositJdpiEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param notifyCreditDepositRepository NotifyCreditDeposit repository.
   * @param notifyCreditDepositEmitter Notify credit deposit event emmiter.
   */
  constructor(
    private logger: Logger,
    private readonly notifyCreditDepositRepository: NotifyCreditDepositRepository,
    private readonly notifyCreditDepositEmitter: NotifyCreditDepositEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandleFailedNotifyCreditDepositJdpiEventUseCase.name,
    });
  }

  /**
   * Notify failed credit deposit.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(payload: NotifyCreditDeposit): Promise<void> {
    this.logger.debug('Notify credit received.', { payload });

    // Save all notify in database
    payload.id = uuidV4();
    payload.state = NotifyStateType.ERROR;
    const result = await this.notifyCreditDepositRepository.create(payload);

    this.logger.debug('Notify created.', { result });

    this.notifyCreditDepositEmitter.errorNotifyCreditDeposit(result);
  }
}
