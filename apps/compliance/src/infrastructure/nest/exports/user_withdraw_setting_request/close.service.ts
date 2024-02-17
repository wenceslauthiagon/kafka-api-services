import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CloseUserWithdrawSettingRequestKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/compliance/infrastructure';
import {
  CloseUserWithdrawSettingRequest,
  CloseUserWithdrawSettingResponse,
} from '@zro/compliance/interface';

const SERVICE = KAFKA_TOPICS.USER_WITHDRAW_SETTING_REQUEST.CLOSE;

/**
 * Service to call close user withdraw setting request at compliance microservice.
 *
 * This class must be created for each request.
 */
@KafkaSubscribeService(SERVICE)
export class CloseUserWithdrawSettingRequestServiceKafka {
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
      context: CloseUserWithdrawSettingRequestServiceKafka.name,
    });
  }

  /**
   * Call compliance microservice to close a user withdraw setting request.
   * @param payload Data.
   */
  async execute(
    payload: CloseUserWithdrawSettingRequest,
  ): Promise<CloseUserWithdrawSettingResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CloseUserWithdrawSettingRequestKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send close user withdraw setting request message.', {
      data,
    });

    // Call close users withdraw setting request microservice.
    const result = await this.kafkaService.send<
      CloseUserWithdrawSettingResponse,
      CloseUserWithdrawSettingRequestKafkaRequest
    >(SERVICE, data);

    logger.debug('Received close user withdraw setting request message.', {
      result,
    });

    return result;
  }
}
