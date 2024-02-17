import { MissingDataException } from '@zro/common';
import { Sms, SmsRepository, SmsState } from '@zro/notifications/domain';
import { Logger } from 'winston';
import {
  SmsNotFoundException,
  SmsEventEmitter,
} from '@zro/notifications/application';

export class HandleSmsDeadLetterUseCase {
  constructor(
    private smsRepository: SmsRepository,
    private smsEventEmitter: SmsEventEmitter,
    private logger: Logger,
  ) {
    this.logger = logger.child({ context: HandleSmsDeadLetterUseCase.name });
  }

  async execute(id: string): Promise<Sms> {
    this.logger.debug('Failing SMS', { id });

    if (!id) {
      throw new MissingDataException(['id']);
    }

    // Get SMS data.
    const sms = await this.smsRepository.getById(id);

    // Sanity check.
    if (!sms) {
      throw new SmsNotFoundException(id);
    }

    // Check if SMS state is final.
    if (sms.isSent() || sms.isFailed()) {
      this.logger.debug('Sms is already sent or failed', { sms });
      return sms;
    }

    // Set SMS was failed.
    sms.state = SmsState.FAILED;

    // Update SMS
    await this.smsRepository.update(sms);

    // Fire SMS sent event.
    await this.smsEventEmitter.emitFailedEvent(sms);

    return sms;
  }
}
