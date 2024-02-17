import { Logger } from 'winston';

import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetWalletByUuidKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';
import {
  GetWalletByUuidRequest,
  GetWalletByUuidResponse,
} from '@zro/operations/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.WALLET.GET_BY_UUID;

/**
 * Operations microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetWalletByUuidServiceKafka {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private requestId: string,
    private logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({ context: GetWalletByUuidServiceKafka.name });
  }

  /**
   * Call operations microservice to get by uuid.
   * @param payload Data.
   */
  async execute(
    payload: GetWalletByUuidRequest,
  ): Promise<GetWalletByUuidResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Send get by wallet payload.', { payload });

    // Request Kafka message.
    const data: GetWalletByUuidKafkaRequest = {
      key: `${payload.uuid}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call get wallet microservice.
    const result = await this.kafkaService.send<
      GetWalletByUuidResponse,
      GetWalletByUuidKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get wallet message.', { result });

    return result;
  }
}
