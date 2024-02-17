import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import { NotificationService } from '@zro/compliance/interface';
import { CreateBellNotificationServiceKafka } from '@zro/notifications/infrastructure';
import {
  CreateBellNotificationRequest,
  CreateBellNotificationResponse,
} from '@zro/notifications/interface';

/**
 * Notification microservice
 */
export class NotificationServiceKafka implements NotificationService {
  static _services: any[] = [CreateBellNotificationServiceKafka];

  private readonly createBellNotificationService: CreateBellNotificationServiceKafka;

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

    this.createBellNotificationService = new CreateBellNotificationServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );
  }

  /**
   * Create a bell notification in microservice.
   * @param request The bell notification.
   * @returns The bell notification created.
   */
  async createBellNotification(
    request: CreateBellNotificationRequest,
  ): Promise<CreateBellNotificationResponse> {
    const response = await this.createBellNotificationService.execute(request);

    if (!response) return null;

    return response;
  }
}
