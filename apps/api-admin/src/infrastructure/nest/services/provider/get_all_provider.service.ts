import { Logger } from 'winston';
import { Injectable } from '@nestjs/common';
import { InjectLogger, KafkaService } from '@zro/common';
import {
  GetAllProviderKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/otc/infrastructure';
import {
  GetAllProviderRequest,
  GetAllProviderResponse,
} from '@zro/otc/interface';

/**
 * Provider microservice.
 */
@Injectable()
export class GetAllProviderServiceKafka {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({ context: GetAllProviderServiceKafka.name });
    this.kafkaService.subscribe([KAFKA_TOPICS.PROVIDER.GET_ALL]);
  }

  /**
   * Call providers microservice to getAll.
   * @param requestId Unique shared request ID.
   * @param payload Data.
   */
  async execute(
    requestId: string,
    payload: GetAllProviderRequest,
  ): Promise<GetAllProviderResponse> {
    const logger = this.logger.child({ loggerId: requestId });

    // Request Kafka message.
    const data: GetAllProviderKafkaRequest = {
      key: `${requestId}`,
      headers: { requestId },
      value: payload,
    };
    logger.debug('Send provider message.');

    // Call getAll Provider microservice.
    const result = await this.kafkaService.send<
      GetAllProviderResponse,
      GetAllProviderKafkaRequest
    >(KAFKA_TOPICS.PROVIDER.GET_ALL, data);

    logger.debug('Received provider message.', result);

    return result;
  }
}
