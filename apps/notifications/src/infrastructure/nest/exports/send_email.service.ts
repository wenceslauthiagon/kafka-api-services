import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateEmailKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/notifications/infrastructure';
import {
  CreateEmailRequest,
  CreateEmailResponse,
} from '@zro/notifications/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.EMAIL.CREATE;

/**
 * Create Notification microservice.
 */
@KafkaSubscribeService(SERVICE)
export class SendEmailServiceKafka {
  /**
   * Default constructor.
   * @param requestId Unique shared request ID.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private readonly requestId: string,
    private readonly logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({ context: SendEmailServiceKafka.name });
  }

  /**
   * Send email.
   * @param payload the Email Request.
   */
  async execute(payload: CreateEmailRequest): Promise<CreateEmailResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreateEmailKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Create EMAIL message.', { data });

    // Call create notifications microservice.
    const result = await this.kafkaService.send<
      CreateEmailResponse,
      CreateEmailKafkaRequest
    >(SERVICE, data);

    logger.debug('Created EMAIL message response.', { result });

    return {
      id: result.id,
      to: result.to,
      from: result.from,
      state: result.state,
    };
  }
}
