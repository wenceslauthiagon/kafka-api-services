import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  RemoveExchangeContractFileKafkaRequest,
} from '@zro/otc/infrastructure';
import {
  RemoveExchangeContractFileRequest,
  RemoveExchangeContractFileResponse,
} from '@zro/otc/interface';

/**
 * Remove file at Exchange Contract.
 */
const SERVICE = KAFKA_TOPICS.EXCHANGE_CONTRACT.REMOVE_FILE;

@KafkaSubscribeService(SERVICE)
export class RemoveExchangeContractFileServiceKafka {
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
      context: RemoveExchangeContractFileServiceKafka.name,
    });
  }

  /**
   * Call otc microservice
   * @param payload Data.
   */
  async execute(
    payload: RemoveExchangeContractFileRequest,
  ): Promise<RemoveExchangeContractFileResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: RemoveExchangeContractFileKafkaRequest = {
      key: this.requestId,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Remove file for exchange contract message.', { data });

    // Call otc microservice.
    const result = await this.kafkaService.send<
      RemoveExchangeContractFileResponse,
      RemoveExchangeContractFileKafkaRequest
    >(SERVICE, data);

    logger.debug('Remove file for exchange contract message.', { result });

    return result;
  }
}
