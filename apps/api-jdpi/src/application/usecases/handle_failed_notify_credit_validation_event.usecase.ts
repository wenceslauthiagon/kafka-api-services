import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  NotifyCreditValidation,
  NotifyCreditValidationRepository,
  NotifyCreditValidationState,
} from '@zro/api-jdpi/domain';

export class HandleFailedNotifyCreditValidationEventUsecase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param notifyCreditValidationRepository NotifyCreditValidation repository.
   */
  constructor(
    private logger: Logger,
    private readonly notifyCreditValidationRepository: NotifyCreditValidationRepository,
  ) {
    this.logger = logger.child({
      context: HandleFailedNotifyCreditValidationEventUsecase.name,
    });
  }

  /**
   * Create a failed notify credit validation.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    payload: NotifyCreditValidation,
  ): Promise<NotifyCreditValidation> {
    if (!payload?.id) {
      throw new MissingDataException(['ID']);
    }

    // Idempotence
    const notifyCreditValidation =
      await this.notifyCreditValidationRepository.getById(payload.id);

    this.logger.debug('Notify credit validation found by id.', {
      notifyCreditValidation,
    });

    if (notifyCreditValidation) return notifyCreditValidation;

    // Save notify credit validation in database
    payload.state = NotifyCreditValidationState.FAILED;
    const result = await this.notifyCreditValidationRepository.create(payload);

    this.logger.debug('Failed notify credit validation created.', { result });

    return result;
  }
}
