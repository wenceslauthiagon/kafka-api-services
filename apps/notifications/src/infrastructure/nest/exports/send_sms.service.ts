import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateSmsKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/notifications/infrastructure';
import {
  CreateSmsRequest,
  CreateSmsResponse,
} from '@zro/notifications/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.SMS.CREATE;

/**
 * Create Notification microservice.
 */
@KafkaSubscribeService(SERVICE)
export class SendSmsServiceKafka {
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
    this.logger = logger.child({ context: SendSmsServiceKafka.name });
  }

  /**
   * Send SMS with verification code.
   * @param payload the Sms Request.
   */
  async execute(payload: CreateSmsRequest): Promise<CreateSmsResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreateSmsKafkaRequest = {
      key: `${payload.userId ?? payload.id}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Create SMS message.', { data });

    // Call create users microservice.
    const result = await this.kafkaService.send<
      CreateSmsResponse,
      CreateSmsKafkaRequest
    >(SERVICE, data);

    logger.debug('Created SMS message response.', { result });

    return {
      id: result.id,
      phoneNumber: result.phoneNumber,
      state: result.state,
    };
  }
}
