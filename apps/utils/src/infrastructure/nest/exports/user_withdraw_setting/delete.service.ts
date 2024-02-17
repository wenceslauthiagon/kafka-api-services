import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  DeleteUserWithdrawSettingKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/utils/infrastructure';
import { DeleteUserWithdrawSettingRequest } from '@zro/utils/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.USER_WITHDRAW_SETTING.DELETE;

/**
 * Delete User withdraw setting microservice.
 */
@KafkaSubscribeService(SERVICE)
export class DeleteUserWithdrawSettingServiceKafka {
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
      context: DeleteUserWithdrawSettingServiceKafka.name,
    });
  }

  /**
   * Call user withdraw setting microservice to delete.
   * @param payload Data.
   */
  async execute(payload: DeleteUserWithdrawSettingRequest): Promise<void> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: DeleteUserWithdrawSettingKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };
    logger.debug('Send delete withdraw message.', { data });

    // Call delete user withdraw setting microservice.
    await this.kafkaService.send<DeleteUserWithdrawSettingKafkaRequest>(
      SERVICE,
      data,
    );

    logger.debug('Received delete withdraw message.');
  }
}
