import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import { User } from '@zro/users/domain';
import { WalletInvitation } from '@zro/operations/domain';
import {
  NotificationEmail,
  NotificationService,
} from '@zro/operations/application';
import { CreateEmailRequest } from '@zro/notifications/interface';
import { SendEmailServiceKafka } from '@zro/notifications/infrastructure';

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

  async sendEmailWalletInvitation(
    walletInvitation: WalletInvitation,
    user: User,
    tag: string,
    url: string,
    from: string,
  ): Promise<NotificationEmail> {
    const data = new CreateEmailRequest({
      id: uuidV4(),
      to: walletInvitation.email,
      from,
      tag,
      data: {
        code: walletInvitation.confirmCode,
        url,
        name: user.name,
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
