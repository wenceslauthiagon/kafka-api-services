import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';

import { KafkaService } from '@zro/common';
import { User } from '@zro/users/domain';
import { PixKey } from '@zro/pix-keys/domain';
import {
  NotificationEmail,
  NotificationService,
  NotificationSms,
} from '@zro/pix-keys/application';
import {
  SendEmailServiceKafka,
  SendSmsServiceKafka,
} from '@zro/notifications/infrastructure';
import {
  CreateSmsRequest,
  CreateEmailRequest,
} from '@zro/notifications/interface';

/**
 * Notification microservice
 */
export class NotificationServiceKafka implements NotificationService {
  static _services: any[] = [SendEmailServiceKafka, SendSmsServiceKafka];

  private readonly sendEmailService: SendEmailServiceKafka;
  private readonly sendSmsService: SendSmsServiceKafka;

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
    this.sendEmailService = new SendEmailServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );
    this.sendSmsService = new SendSmsServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );
  }

  /**
   * Send e-mail with verification code.
   * @param user User.
   * @param pixKey Pix key.
   * @param from E-mail from.
   * @param tag E-mail template tag.
   */
  async sendEmailCode(
    user: User,
    pixKey: PixKey,
    from: string,
    tag: string,
  ): Promise<NotificationEmail> {
    const data = new CreateEmailRequest({
      id: uuidV4(),
      to: pixKey.key,
      from,
      tag,
      userId: user.uuid,
      data: {
        key: pixKey.key,
        code: pixKey.code,
      },
      issuedBy: pixKey.id,
    });

    const response = await this.sendEmailService.execute(data);

    return {
      id: response.id,
      to: response.to,
      from: response.from,
      state: response.state,
    };
  }

  /**
   * Send SMS with verification code.
   * @param user User.
   * @param pixKey Pix key.
   * @param tag SMS template tag.
   */
  async sendSmsCode(
    user: User,
    pixKey: PixKey,
    tag: string,
  ): Promise<NotificationSms> {
    const data = new CreateSmsRequest({
      id: uuidV4(),
      phoneNumber: pixKey.key,
      tag,
      userId: user.uuid,
      data: {
        key: pixKey.key,
        code: pixKey.code,
      },
      issuedBy: pixKey.id,
    });

    const response = await this.sendSmsService.execute(data);

    return {
      id: response.id,
      phoneNumber: response.phoneNumber,
      state: response.state,
    };
  }
}
