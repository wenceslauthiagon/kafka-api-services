import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  UpdateWalletByUuidAndUserKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';
import {
  UpdateWalletByUuidAndUserRequest,
  UpdateWalletByUuidAndUserResponse,
} from '@zro/operations/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.WALLET.UPDATE_BY_UUID_AND_USER;

/**
 * Operations microservice.
 */
@KafkaSubscribeService(SERVICE)
export class UpdateWalletByUuidAndUserServiceKafka {
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
      context: UpdateWalletByUuidAndUserServiceKafka.name,
    });
  }

  /**
   * Call operations microservice to update wallet by user.
   * @param payload Data.
   */
  async execute(
    payload: UpdateWalletByUuidAndUserRequest,
  ): Promise<UpdateWalletByUuidAndUserResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Send update wallet by user payload.', { payload });

    // Request Kafka message.
    const data: UpdateWalletByUuidAndUserKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call update wallet by user microservice.
    const result = await this.kafkaService.send<
      UpdateWalletByUuidAndUserResponse,
      UpdateWalletByUuidAndUserKafkaRequest
    >(SERVICE, data);

    logger.debug('Update wallet by user message received.', { result });

    return result;
  }
}
