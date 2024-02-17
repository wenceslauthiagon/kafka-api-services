import { Logger } from 'winston';
import { Injectable } from '@nestjs/common';
import { InjectLogger, KafkaService } from '@zro/common';
import {
  KAFKA_TOPICS,
  UpdateExchangeContractKafkaRequest,
} from '@zro/otc/infrastructure';
import {
  UpdateExchangeContractRequest,
  UpdateExchangeContractResponse,
} from '@zro/otc/interface';

/**
 * Update Exchange Contract.
 */
@Injectable()
export class UpdateExchangeContractServiceKafka {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    @InjectLogger() private readonly logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({
      context: UpdateExchangeContractServiceKafka.name,
    });
    this.kafkaService.subscribe([KAFKA_TOPICS.EXCHANGE_CONTRACT.UPDATE]);
  }

  /**
   * Call otc microservice to Update.
   * @param requestId Unique shared request ID.
   * @param payload Data.
   */
  async execute(
    requestId: string,
    payload: UpdateExchangeContractRequest,
  ): Promise<UpdateExchangeContractResponse> {
    const logger = this.logger.child({ loggerId: requestId });

    // Request Kafka message.
    const data: UpdateExchangeContractKafkaRequest = {
      key: requestId,
      headers: { requestId },
      value: payload,
    };
    logger.debug('Send Update exchange contract message.');

    // Call otc microservice.
    const result = await this.kafkaService.send<
      UpdateExchangeContractResponse,
      UpdateExchangeContractKafkaRequest
    >(KAFKA_TOPICS.EXCHANGE_CONTRACT.UPDATE, data);

    logger.debug('Received Update exchange contract message.', result);

    return result;
  }
}
