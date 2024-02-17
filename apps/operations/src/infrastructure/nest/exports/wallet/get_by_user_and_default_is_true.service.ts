import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetWalletByUserAndDefaultIsTrueKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';
import {
  GetWalletByUserAndDefaultIsTrueRequest,
  GetWalletByUserAndDefaultIsTrueResponse,
} from '@zro/operations/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.WALLET.GET_BY_USER_AND_DEFAULT_IS_TRUE;

/**
 * Operations microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetWalletByUserAndDefaultIsTrueServiceKafka {
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
    this.logger = logger.child({
      context: GetWalletByUserAndDefaultIsTrueServiceKafka.name,
    });
  }

  /**
   * Call operations microservice to get wallet by user and default is true.
   * @param payload Data.
   */
  async execute(
    payload: GetWalletByUserAndDefaultIsTrueRequest,
  ): Promise<GetWalletByUserAndDefaultIsTrueResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Send get wallet by user and default is true payload.', {
      payload,
    });

    // Request Kafka message.
    const data: GetWalletByUserAndDefaultIsTrueKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call get wallet by user and default is true microservice.
    const result = await this.kafkaService.send<
      GetWalletByUserAndDefaultIsTrueResponse,
      GetWalletByUserAndDefaultIsTrueKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get wallet by user and default is true message.', {
      result,
    });

    return result;
  }
}
