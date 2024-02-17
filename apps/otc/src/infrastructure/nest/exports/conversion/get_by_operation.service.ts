import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  GetConversionByOperationKafkaRequest,
} from '@zro/otc/infrastructure';
import {
  GetConversionByOperationRequest,
  GetConversionByOperationResponse,
} from '@zro/otc/interface';

/**
 * Get conversion by operation.
 */
const SERVICE = KAFKA_TOPICS.CONVERSION.GET_BY_OPERATION;

@KafkaSubscribeService(SERVICE)
export class GetConversionByOperationServiceKafka {
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
      context: GetConversionByOperationServiceKafka.name,
    });
  }

  /**
   * Call otc microservice
   * @param payload Data.
   */
  async execute(
    payload: GetConversionByOperationRequest,
  ): Promise<GetConversionByOperationResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetConversionByOperationKafkaRequest = {
      key: payload.operationId,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Get conversion by operation message.', { data });

    // Call otc microservice.
    const result = await this.kafkaService.send<
      GetConversionByOperationResponse,
      GetConversionByOperationKafkaRequest
    >(SERVICE, data);

    logger.debug('Get conversion by operation result.', { result });

    return result;
  }
}
