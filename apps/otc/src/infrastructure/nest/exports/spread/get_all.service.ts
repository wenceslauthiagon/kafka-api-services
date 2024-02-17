import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  GetAllSpreadKafkaRequest,
} from '@zro/otc/infrastructure';
import { GetAllSpreadRequest, GetAllSpreadResponse } from '@zro/otc/interface';

/**
 * Get all spreads.
 */
const SERVICE = KAFKA_TOPICS.SPREAD.GET_ALL;

@KafkaSubscribeService(SERVICE)
export class GetAllSpreadServiceKafka {
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
    this.logger = logger.child({ context: GetAllSpreadServiceKafka.name });
  }

  /**
   * Call otc microservice
   * @param payload Data.
   */
  async execute(payload: GetAllSpreadRequest): Promise<GetAllSpreadResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetAllSpreadKafkaRequest = {
      key: null,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Get all spreads message.', { data });

    // Call otc microservice.
    const result = await this.kafkaService.send<
      GetAllSpreadResponse,
      GetAllSpreadKafkaRequest
    >(SERVICE, data);

    logger.debug('Get all spreads result.', { result });

    return result;
  }
}
