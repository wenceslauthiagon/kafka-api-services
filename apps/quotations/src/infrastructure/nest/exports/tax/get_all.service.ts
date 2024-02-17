import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  GetAllTaxKafkaRequest,
} from '@zro/quotations/infrastructure';
import { GetAllTaxRequest, GetAllTaxResponse } from '@zro/quotations/interface';

/**
 * Get taxes.
 */
const SERVICE = KAFKA_TOPICS.TAX.GET_ALL;

@KafkaSubscribeService(SERVICE)
export class GetAllTaxServiceKafka {
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
    this.logger = logger.child({ context: GetAllTaxServiceKafka.name });
  }

  /**
   * Call otc microservice
   * @param payload Data.
   */
  async execute(payload: GetAllTaxRequest): Promise<GetAllTaxResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetAllTaxKafkaRequest = {
      key: null,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Get taxes message.', { data });

    // Call otc microservice.
    const result = await this.kafkaService.send<
      GetAllTaxResponse,
      GetAllTaxKafkaRequest
    >(SERVICE, data);

    logger.debug('Get taxes result.', { result });

    return result;
  }
}
