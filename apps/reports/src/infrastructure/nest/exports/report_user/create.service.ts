import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateReportUserKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/reports/infrastructure';
import {
  CreateReportUserRequest,
  CreateReportUserResponse,
} from '@zro/reports/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.REPORT_USER.CREATE;

/**
 * Report user microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CreateReportUserServiceKafka {
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
      context: CreateReportUserServiceKafka.name,
    });
  }

  /**
   * Call reports microservice to create.
   * @param payload Data.
   */
  async execute(
    payload: CreateReportUserRequest,
  ): Promise<CreateReportUserResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreateReportUserKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send Report user message.', { data });

    // Call create Report user message.
    const result = await this.kafkaService.send<
      CreateReportUserResponse,
      CreateReportUserKafkaRequest
    >(SERVICE, data);

    logger.debug('Created Report user message.', result);

    return result;
  }
}
