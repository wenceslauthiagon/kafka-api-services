import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateBellNotificationKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/notifications/infrastructure';
import {
  CreateBellNotificationRequest,
  CreateBellNotificationResponse,
} from '@zro/notifications/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.BELL_NOTIFICATION.CREATE;

/**
 * Create Notification microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CreateBellNotificationServiceKafka {
  /**
   * Default constructor.
   * @param requestId Unique shared request ID.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private requestId: string,
    private logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({
      context: CreateBellNotificationServiceKafka.name,
    });
  }

  /**
   * Call Notification microservice to create notification.
   * @param payload Data.
   */
  async execute(
    payload: CreateBellNotificationRequest,
  ): Promise<CreateBellNotificationResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreateBellNotificationKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };
    logger.debug('Send create bell notification message.', { data });

    // Call Notification microservice.
    const result = await this.kafkaService.send<
      CreateBellNotificationResponse,
      CreateBellNotificationKafkaRequest
    >(SERVICE, data);

    logger.debug('Received bell notification created message.', { result });

    return result;
  }
}
