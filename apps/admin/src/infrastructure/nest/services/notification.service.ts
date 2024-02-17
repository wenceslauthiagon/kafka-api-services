import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import { Admin } from '@zro/admin/domain';
import { NotificationEmail, NotificationService } from '@zro/admin/application';
import { SendEmailServiceKafka } from '@zro/notifications/infrastructure';
import { CreateEmailRequest } from '@zro/notifications/interface';

/**
 * Notification microservice
 */
export class NotificationServiceKafka implements NotificationService {
  static _services: any[] = [SendEmailServiceKafka];

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
    this.sendEmailService = new SendEmailServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );
  }

  /**
   * Send e-mail with verification code.
   * @param admin Admin.
   * @param verificationCode Verification code.
   * @param from E-mail from.
   * @param tag E-mail template tag.
   */
  async sendEmailCode(
    admin: Admin,
    verificationCode: string,
    from: string,
    tag: string,
  ): Promise<NotificationEmail> {
    const data = new CreateEmailRequest({
      id: uuidV4(),
      to: admin.email,
      from,
      tag,
      data: {
        name: admin.name,
        url: `${process.env.API_ADMIN_URL_NEW_PASSWORD}/${admin.id}`,
        resetToken: verificationCode,
      },
    });

    const response = await this.sendEmailService.execute(data);

    return {
      id: response.id,
      to: response.to,
      from: response.from,
      state: response.state,
    };
  }
}
