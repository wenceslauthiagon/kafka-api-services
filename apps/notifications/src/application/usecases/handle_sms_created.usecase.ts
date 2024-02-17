import { MissingDataException } from '@zro/common';
import { Sms, SmsRepository, SmsState } from '@zro/notifications/domain';
import { Logger } from 'winston';
import { SmsEventEmitter } from '../events/sms.emitter';
import { SmsNotFoundException } from '@zro/notifications/application';
import { SmsGateway } from '../gateways/sms.gateway';

export class HandleSmsCreatedUseCase {
  constructor(
    private smsRepository: SmsRepository,
    private smsEventEmitter: SmsEventEmitter,
    private smsGateway: SmsGateway,
    private logger: Logger,
  ) {
    this.logger = logger.child({ context: HandleSmsCreatedUseCase.name });
  }

  async execute(id: string): Promise<Sms> {
    this.logger.debug('Sending sms', { id });

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

    // Send SMS
    await this.smsGateway.send(sms);

    // Set SMS was sent.
    sms.state = SmsState.SENT;

    // Update SMS
    await this.smsRepository.update(sms);

    // Fire SMS sent event.
    await this.smsEventEmitter.emitSentEvent(sms);

    return sms;
  }
}
