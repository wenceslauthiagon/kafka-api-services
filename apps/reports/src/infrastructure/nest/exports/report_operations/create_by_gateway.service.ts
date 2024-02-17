import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateReportOperationByGatewayKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/reports/infrastructure';
import {
  CreateReportOperationByGatewayRequest,
  CreateReportOperationByGatewayResponse,
} from '@zro/reports/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.REPORT_OPERATION.CREATE_BY_GATEWAY;

/**
 * Report Operation microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CreateReportOperationByGatewayServiceKafka {
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
      context: CreateReportOperationByGatewayServiceKafka.name,
    });
  }

  /**
   * Call reports microservice to create.
   * @param payload Data.
   */
  async execute(
    payload: CreateReportOperationByGatewayRequest,
  ): Promise<CreateReportOperationByGatewayResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreateReportOperationByGatewayKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send Report Operation message.', { data });

    // Call create Report Operation message.
    const result = await this.kafkaService.send<
      CreateReportOperationByGatewayResponse,
      CreateReportOperationByGatewayKafkaRequest
    >(SERVICE, data);

    logger.debug('Created Report Operation message.', result);

    return result;
  }
}
