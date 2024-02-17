import { Logger } from 'winston';
import { Injectable } from '@nestjs/common';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetAllTaxKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/quotations/infrastructure';
import { GetAllTaxRequest, GetAllTaxResponse } from '@zro/quotations/interface';

// Service topic from Tax.
const SERVICE = KAFKA_TOPICS.TAX.GET_ALL;

/**
 * Tax microservice.
 */
@KafkaSubscribeService(SERVICE)
@Injectable()
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
    this.kafkaService.subscribe([KAFKA_TOPICS.TAX.GET_ALL]);
  }

  /**
   * Call otc microservice to getAll.
   * @param requestId Unique shared request ID.
   * @param payload Data.
   */
  async execute(payload: GetAllTaxRequest): Promise<GetAllTaxResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetAllTaxKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };
    logger.debug('Send tax message.');

    // Call getAll Tax microservice.
    const result = await this.kafkaService.send<
      GetAllTaxResponse,
      GetAllTaxKafkaRequest
    >(SERVICE, data);

    logger.debug('Received tax message.', result);

    return result;
  }
}
