import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateApproveUserWithdrawSettingRequestKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/compliance/infrastructure';
import {
  CreateApproveUserWithdrawSettingRequest,
  CreateApproveUserWithdrawSettingRequestResponse,
} from '@zro/compliance/interface';

const SERVICE = KAFKA_TOPICS.USER_WITHDRAW_SETTING_REQUEST.CREATE_APPROVE;

/**
 * Service to call create user withdraw setting request at compliance microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CreateApproveUserWithdrawSettingRequestServiceKafka {
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
      context: CreateApproveUserWithdrawSettingRequestServiceKafka.name,
    });
  }

  /**
   * Call compliance microservice to create a new user withdraw setting request.
   * @param payload Data.
   */
  async execute(
    payload: CreateApproveUserWithdrawSettingRequest,
  ): Promise<CreateApproveUserWithdrawSettingRequestResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreateApproveUserWithdrawSettingRequestKafkaRequest = {
      key: payload.userId,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug(
      'Send create and Approve user withdraw setting request message.',
      { data },
    );

    // Call create users withdraw setting request microservice.
    const result = await this.kafkaService.send<
      CreateApproveUserWithdrawSettingRequestResponse,
      CreateApproveUserWithdrawSettingRequestKafkaRequest
    >(SERVICE, data);

    logger.debug(
      'Received create and Approve user withdraw setting request message.',
      { result },
    );

    return result;
  }
}
