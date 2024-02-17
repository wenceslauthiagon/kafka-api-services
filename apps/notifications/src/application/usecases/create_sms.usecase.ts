import { MissingDataException } from '@zro/common';
import {
  Sms,
  SmsEntity,
  SmsRepository,
  SmsState,
  SmsTemplateRepository,
} from '@zro/notifications/domain';
import { User } from '@zro/users/domain';
import { Logger } from 'winston';
import {
  SmsTemplateTagNotFoundException,
  SmsEventEmitter,
  EncryptProvider,
} from '@zro/notifications/application';

export const SMS_MAX_MESSAGE_LENGTH = 70;

/**
 * Send SMS from a template.
 */
export class CreateSmsUseCase {
  /**
   * Default constructor.
   * @param logger System logger.
   * @param smsRepository E-mail repository.
   * @param encryptProvider
   * @param smsTemplateRepository Template repository.
   * @param smsEventEmitter Event emitter.
   */
  constructor(
    private readonly smsRepository: SmsRepository,
    private readonly smsTemplateRepository: SmsTemplateRepository,
    private readonly smsEventEmitter: SmsEventEmitter,
    private readonly encryptProvider: EncryptProvider,
    private logger: Logger,
  ) {
    this.logger = logger.child({ context: CreateSmsUseCase.name });
  }

  /**
   * Create and schedule an SMS to be sent.
   *
   * @param id User defined ID.
   * @param phoneNumber Destination phone number.
   * @param tag E-mail template tag.
   * @param data E-mail template data.
   * @param user Destination user.
   * @param issuedBy Requester UUID.
   * @returns Create SMS.
   */
  async execute(
    id: string,
    phoneNumber: string,
    tag: string,
    data?: Record<string, string>,
    user?: User,
    issuedBy?: string,
  ): Promise<Sms> {
    this.logger.debug('Creating SMS', {
      id,
      phoneNumber,
      tag,
      user,
      issuedBy,
    });

    // Check inputs
    if (!id || !phoneNumber || !tag) {
      throw new MissingDataException([
        ...(!id ? ['id'] : []),
        ...(!phoneNumber ? ['phoneNumber'] : []),
        ...(!tag ? ['tag'] : []),
      ]);
    }

    // Search if there is an SMS with the same ID.
    const foundSms = await this.smsRepository.getById(id);

    if (foundSms) {
      this.logger.warn('Indepotent SMS creation.', {
        id,
        phoneNumber: foundSms.phoneNumber,
      });

      return foundSms;
    }

    // Search sms template by tag.
    const template = await this.smsTemplateRepository.getByTag(tag);

    if (!template) {
      throw new SmsTemplateTagNotFoundException(tag);
    }

    // Extract SMS message from tempĺate.
    let { body } = template.extract(data);

    // Encrypts possible sensitive data.
    body = body && this.encryptProvider.encrypt(body);

    const sms = new SmsEntity({
      id,
      phoneNumber,
      body,
      template,
      user,
      issuedBy,
      state: SmsState.PENDING,
    });

    // Store sms on repository.
    await this.smsRepository.create(sms);

    this.logger.info('SMS created', { id, phoneNumber, issuedBy });

    // Fire created event.
    await this.smsEventEmitter.emitCreatedEvent(sms);

    return sms;
  }
}
