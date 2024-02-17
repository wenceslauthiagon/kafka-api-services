import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { KafkaService } from '@zro/common';
import { UserForgotPassword } from '@zro/users/domain';
import { NotificationService } from '@zro/users/application';
import {
  SendEmailServiceKafka,
  SendSmsServiceKafka,
} from '@zro/notifications/infrastructure';
import {
  CreateEmailRequest,
  CreateSmsRequest,
} from '@zro/notifications/interface';

export class NotificationServiceKafka implements NotificationService {
  static _services: any[] = [SendEmailServiceKafka, SendSmsServiceKafka];

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

  async sendSms(
    userForgotPassword: UserForgotPassword,
    tag: string,
  ): Promise<void> {
    const payload = new CreateSmsRequest({
      id: uuidV4(),
      phoneNumber: '+' + userForgotPassword.phoneNumber,
      tag,
      data: {
        code: `${userForgotPassword.code}`,
      },
      issuedBy: userForgotPassword.id,
      userId: userForgotPassword.user.uuid,
    });

    this.logger.debug('Send sms payload.', { payload });

    const response = await this.sendSmsService.execute(payload);

    this.logger.debug('Send sms response.', { response });
  }

  async sendEmail(
    userForgotPassword: UserForgotPassword,
    emailFrom: string,
    tag: string,
  ): Promise<void> {
    const data = new CreateEmailRequest({
      id: uuidV4(),
      to: userForgotPassword.email,
      from: emailFrom,
      tag,
      data: {
        code: userForgotPassword.code,
      },
    });

    await this.sendEmailService.execute(data);
  }
}
