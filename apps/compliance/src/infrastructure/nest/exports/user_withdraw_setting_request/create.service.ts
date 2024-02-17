import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateUserWithdrawSettingRequestKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/compliance/infrastructure';
import {
  CreateUserWithdrawSettingRequest,
  CreateUserWithdrawSettingRequestResponse,
} from '@zro/compliance/interface';

const SERVICE = KAFKA_TOPICS.USER_WITHDRAW_SETTING_REQUEST.CREATE;

/**
 * Service to call create user withdraw setting request at compliance microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CreateUserWithdrawSettingRequestServiceKafka {
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
      context: CreateUserWithdrawSettingRequestServiceKafka.name,
    });
  }

  /**
   * Call compliance microservice to create a new user withdraw setting request.
   * @param payload Data.
   */
  async execute(
    payload: CreateUserWithdrawSettingRequest,
  ): Promise<CreateUserWithdrawSettingRequestResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreateUserWithdrawSettingRequestKafkaRequest = {
      key: payload.userId,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send create user withdraw setting request message.', {
      data,
    });

    // Call create users withdraw setting request microservice.
    const result = await this.kafkaService.send<
      CreateUserWithdrawSettingRequestResponse,
      CreateUserWithdrawSettingRequestKafkaRequest
    >(SERVICE, data);

    logger.debug('Received create user withdraw setting request message.', {
      result,
    });

    return result;
  }
}
