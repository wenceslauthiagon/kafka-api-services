import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateUserWithdrawSettingKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/utils/infrastructure';
import {
  CreateUserWithdrawSettingRequest,
  CreateUserWithdrawSettingResponse,
} from '@zro/utils/interface';

const SERVICE = KAFKA_TOPICS.USER_WITHDRAW_SETTING.CREATE;

/**
 * Service to call create user withdraw setting at utils microservice.
 *
 * This class must be created for each request.
 */
@KafkaSubscribeService(SERVICE)
export class CreateUserWithdrawSettingServiceKafka {
  /**
   * Default constructor.
   * @param requestId Unique shared request ID.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private readonly requestId: string,
    private readonly logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({
      context: CreateUserWithdrawSettingServiceKafka.name,
    });
  }

  /**
   * Call utils microservice to create a new user withdraw setting.
   * @param payload Data.
   */
  async execute(
    payload: CreateUserWithdrawSettingRequest,
  ): Promise<CreateUserWithdrawSettingResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    //  Kafka message.
    const data: CreateUserWithdrawSettingKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send create user withdraw setting message.', {
      data,
    });

    // Call create users withdraw setting microservice.
    const result = await this.kafkaService.send<
      CreateUserWithdrawSettingResponse,
      CreateUserWithdrawSettingKafkaRequest
    >(SERVICE, data);

    logger.debug('Received create user withdraw setting message.', {
      result,
    });

    return result;
  }
}
