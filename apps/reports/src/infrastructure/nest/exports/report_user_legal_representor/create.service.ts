import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateReportUserLegalRepresentorKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/reports/infrastructure';
import {
  CreateReportUserLegalRepresentorRequest,
  CreateReportUserLegalRepresentorResponse,
} from '@zro/reports/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.REPORT_USER_LEGAL_REPRESENTOR.CREATE;

/**
 * Report user legal representor microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CreateReportUserLegalRepresentorServiceKafka {
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
      context: CreateReportUserLegalRepresentorServiceKafka.name,
    });
  }

  /**
   * Call reports microservice to create.
   * @param payload Data.
   */
  async execute(
    payload: CreateReportUserLegalRepresentorRequest,
  ): Promise<CreateReportUserLegalRepresentorResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreateReportUserLegalRepresentorKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send Report user legal representor message.', { data });

    // Call create Report user legal representor message.
    const result = await this.kafkaService.send<
      CreateReportUserLegalRepresentorResponse,
      CreateReportUserLegalRepresentorKafkaRequest
    >(SERVICE, data);

    logger.debug('Created Report user legal representor message.', { result });

    return result;
  }
}
