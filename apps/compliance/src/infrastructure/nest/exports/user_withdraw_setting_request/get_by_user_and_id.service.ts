import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetUserWithdrawSettingRequestByUserAndIdKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/compliance/infrastructure';
import {
  GetUserWithdrawSettingRequestByUserAndIdRequest,
  GetUserWithdrawSettingRequestByUserAndIdResponse,
} from '@zro/compliance/interface';

const SERVICE = KAFKA_TOPICS.USER_WITHDRAW_SETTING_REQUEST.GET_BY_USER_AND_ID;

/**
 * Service to call get user withdraw setting request by user and id at compliance microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetUserWithdrawSettingRequestByUserAndIdServiceKafka {
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
      context: GetUserWithdrawSettingRequestByUserAndIdServiceKafka.name,
    });
  }

  /**
   * Call compliance microservice to get a user withdraw setting request by user and id.
   * @param payload Data.
   */
  async execute(
    payload: GetUserWithdrawSettingRequestByUserAndIdRequest,
  ): Promise<GetUserWithdrawSettingRequestByUserAndIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // RequestKafka message.
    const data: GetUserWithdrawSettingRequestByUserAndIdKafkaRequest = {
      key: payload.userId,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug(
      'Send get user withdraw setting request by user and id message.',
      { data },
    );

    // Call get users withdraw seting request microservice.
    const result = await this.kafkaService.send<
      GetUserWithdrawSettingRequestByUserAndIdResponse,
      GetUserWithdrawSettingRequestByUserAndIdKafkaRequest
    >(SERVICE, data);

    logger.debug(
      'Received get user withdraw setting request by user and id message.',
      { result },
    );

    return result;
  }
}
