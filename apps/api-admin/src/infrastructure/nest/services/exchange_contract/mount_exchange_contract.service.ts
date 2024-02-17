import { Logger } from 'winston';
import { Injectable } from '@nestjs/common';
import { InjectLogger, KafkaService } from '@zro/common';
import {
  KAFKA_TOPICS,
  MountExchangeContractKafkaRequest,
} from '@zro/otc/infrastructure';
import {
  MountExchangeContractRequest,
  MountExchangeContractResponse,
} from '@zro/otc/interface';

/**
 * Mount Exchange Contract.
 */
@Injectable()
export class MountExchangeContractServiceKafka {
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
      context: MountExchangeContractServiceKafka.name,
    });
    this.kafkaService.subscribe([KAFKA_TOPICS.EXCHANGE_CONTRACT.CREATE]);
  }

  /**
   * Call otc microservice to mount.
   * @param requestId Unique shared request ID.
   * @param payload Data.
   */
  async execute(
    requestId: string,
    payload: MountExchangeContractRequest,
  ): Promise<MountExchangeContractResponse> {
    const logger = this.logger.child({ loggerId: requestId });

    // Request Kafka message.
    const data: MountExchangeContractKafkaRequest = {
      key: requestId,
      headers: { requestId },
      value: payload,
    };
    logger.debug('Send mount exchange contract message.');

    // Call otc microservice.
    const result = await this.kafkaService.send<
      MountExchangeContractResponse,
      MountExchangeContractKafkaRequest
    >(KAFKA_TOPICS.EXCHANGE_CONTRACT.CREATE, data);

    logger.debug('Received mount exchange contract message.', result);

    return result;
  }
}
