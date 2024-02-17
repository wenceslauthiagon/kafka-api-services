import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  DeleteWalletByUuidAndUserKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/operations/infrastructure';
import { DeleteWalletByUuidAndUserRequest } from '@zro/operations/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.WALLET.DELETE_BY_UUID_AND_USER;

/**
 * Operations microservice.
 */
@KafkaSubscribeService(SERVICE)
export class DeleteWalletByUuidAndUserServiceKafka {
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
      context: DeleteWalletByUuidAndUserServiceKafka.name,
    });
  }

  /**
   * Call operations microservice to delete wallet by user.
   * @param payload Data.
   */
  async execute(payload: DeleteWalletByUuidAndUserRequest): Promise<void> {
    const logger = this.logger.child({ loggerId: this.requestId });

    logger.debug('Send delete wallet by user payload.', { payload });

    // Request Kafka message.
    const data: DeleteWalletByUuidAndUserKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    // Call delete wallet by user microservice.
    const result = await this.kafkaService.send<
      void,
      DeleteWalletByUuidAndUserKafkaRequest
    >(SERVICE, data);

    logger.debug('Delete wallet by user message received.', { result });
  }
}
