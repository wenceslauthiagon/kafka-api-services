import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateReportOperationKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/reports/infrastructure';
import {
  CreateReportOperationRequest,
  CreateReportOperationResponse,
} from '@zro/reports/interface';

const SERVICE = KAFKA_TOPICS.REPORT_OPERATION.CREATE;

/**
 * Report Operation microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CreateReportOperationServiceKafka {
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
      context: CreateReportOperationServiceKafka.name,
    });
  }

  /**
   * Call reports microservice to create.
   * @param payload Data.
   */
  async execute(
    payload: CreateReportOperationRequest,
  ): Promise<CreateReportOperationResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    const data: CreateReportOperationKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send Report Operation message.', { data });

    const result = await this.kafkaService.send<
      CreateReportOperationResponse,
      CreateReportOperationKafkaRequest
    >(SERVICE, data);

    logger.debug('Created Report Operation message.', result);

    return result;
  }
}
