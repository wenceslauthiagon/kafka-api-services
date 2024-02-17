import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  NotifyStateType,
  NotifyConfirmBankingTedEntity,
  NotifyConfirmBankingTedRepository,
} from '@zro/api-topazio/domain';

export class HandleNotifyConfirmBankingTedTopazioEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param notifyBankingTedRepository repository.
   * @param bankingService Banking service.
   */
  constructor(
    private logger: Logger,
    private readonly notifyBankingTedRepository: NotifyConfirmBankingTedRepository,
  ) {
    this.logger = logger.child({
      context: HandleNotifyConfirmBankingTedTopazioEventUseCase.name,
    });
  }

  /**
   * NotifyConfirm completion and send to banking.
   *
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(payload: NotifyConfirmBankingTedEntity): Promise<void> {
    const { transactionId } = payload;

    if (!transactionId) {
      throw new MissingDataException(['Transaction ID']);
    }

    this.logger.debug('Created notify confirmation');

    // Save all notify in database
    payload.state = NotifyStateType.READY;
    await this.notifyBankingTedRepository.create(payload);
  }
}
