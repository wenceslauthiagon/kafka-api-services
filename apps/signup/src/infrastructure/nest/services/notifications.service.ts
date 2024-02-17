import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import { Signup } from '@zro/signup/domain';
import { NotificationService, NotificationSms } from '@zro/signup/application';
import {
  CreateSmsRequest,
  CreateEmailRequest,
} from '@zro/notifications/interface';
import {
  SendSmsServiceKafka,
  SendEmailServiceKafka,
} from '@zro/notifications/infrastructure';

/**
 * Notification microservice
 */
export class NotificationServiceKafka implements NotificationService {
  static _services: any[] = [SendSmsServiceKafka, SendEmailServiceKafka];

  private readonly sendSmsService: SendSmsServiceKafka;
  private readonly sendEmailService: SendEmailServiceKafka;

  /**
   * Default constructor.
   * @param requestId The request id.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private requestId: string,
    private logger: Logger,
    private kafkaService: KafkaService,
  ) {
    this.logger = logger.child({ context: NotificationServiceKafka.name });

    this.sendSmsService = new SendSmsServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );
    this.sendEmailService = new SendEmailServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );
  }

  /**
   * Send SMS with verification code.
   * @param signup Signup.
   * @param tag SMS template tag.
   */
  async sendSmsCode(signup: Signup, tag: string): Promise<NotificationSms> {
    const payload = new CreateSmsRequest({
      id: uuidV4(),
      phoneNumber: signup.phoneNumber,
      tag,
      data: {
        code: `${signup.confirmCode}`,
      },
      issuedBy: signup.id,
    });

    this.logger.debug('Send sms payload.', { payload });

    const response = await this.sendSmsService.execute(payload);

    this.logger.debug('Send sms response.', { response });

    return {
      id: response.id,
      phoneNumber: response.phoneNumber,
      state: response.state,
    };
  }

  /**
   * Send email with verification code.
   * @param signup Signup.
   * @param emailFrom Email from.
   * @param tag Email template tag.
   */
  async sendEmailCode(
    signup: Signup,
    tag: string,
    emailFrom: string,
  ): Promise<void> {
    const data = new CreateEmailRequest({
      id: uuidV4(),
      to: signup.email,
      from: emailFrom,
      tag,
      data: {
        code: signup.confirmCode,
      },
    });

    await this.sendEmailService.execute(data);
  }
}
