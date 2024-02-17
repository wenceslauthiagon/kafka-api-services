import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import {
  NotifyCreditDevolution,
  NotifyCreditDevolutionRepository,
  NotifyStateType,
} from '@zro/api-jdpi/domain';
import { NotifyCreditDevolutionEventEmitter } from '@zro/api-jdpi/application';

export class HandleFailedNotifyCreditDevolutionJdpiEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param notifyCreditDevolutionRepository NotifyCreditDevolution repository.
   * @param notifyCreditDevolutionEmitter NotifyCreditDevolution event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly notifyCreditDevolutionRepository: NotifyCreditDevolutionRepository,
    private readonly notifyCreditDevolutionEmitter: NotifyCreditDevolutionEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandleFailedNotifyCreditDevolutionJdpiEventUseCase.name,
    });
  }

  /**
   * Notify failed credit devolution.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(payload: NotifyCreditDevolution): Promise<void> {
    this.logger.debug('Notify credit received.', { payload });

    // Save all notify in database
    payload.id = uuidV4();
    payload.state = NotifyStateType.ERROR;
    const result = await this.notifyCreditDevolutionRepository.create(payload);

    this.logger.debug('Notify created.', { result });

    this.notifyCreditDevolutionEmitter.errorNotifyCreditDevolution(result);
  }
}
