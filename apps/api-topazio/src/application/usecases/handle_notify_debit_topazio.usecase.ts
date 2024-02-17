import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  NotifyStateType,
  NotifyDebitEntity,
  NotifyDebitRepository,
} from '@zro/api-topazio/domain';

export class HandleNotifyDebitTopazioEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param notifyDebitRepository repository.
   */
  constructor(
    private logger: Logger,
    private readonly notifyDebitRepository: NotifyDebitRepository,
  ) {
    this.logger = logger.child({
      context: HandleNotifyDebitTopazioEventUseCase.name,
    });
  }

  /**
   * Notify Debit and send to pixPayment.
   *
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(payload: NotifyDebitEntity): Promise<void> {
    this.logger.debug('Notify debit received.', { notifyDebit: payload });

    const { transactionId } = payload;
    if (!transactionId) {
      throw new MissingDataException(['Transaction ID']);
    }

    // Save all notify in database
    payload.state = NotifyStateType.READY;
    await this.notifyDebitRepository.create(payload);
  }
}
