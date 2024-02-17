import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetAllUserWithdrawSettingKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/utils/infrastructure';
import {
  GetAllUserWithdrawSettingRequest,
  GetAllUserWithdrawSettingResponse,
} from '@zro/utils/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.USER_WITHDRAW_SETTING.GET_ALL;

/**
 * Withdrawals microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetAllUserWithdrawSettingServiceKafka {
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
      context: GetAllUserWithdrawSettingServiceKafka.name,
    });
  }

  /**
   * Call withdrawals microservice to getAll.
   * @param payload Data.
   */
  async execute(
    payload: GetAllUserWithdrawSettingRequest,
  ): Promise<GetAllUserWithdrawSettingResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetAllUserWithdrawSettingKafkaRequest = {
      key: `${payload.walletId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };
    logger.debug('Send withdrawals message.', { data });

    // Call getAll withdrawals microservice.
    const result = await this.kafkaService.send<
      GetAllUserWithdrawSettingResponse,
      GetAllUserWithdrawSettingKafkaRequest
    >(SERVICE, data);

    logger.debug('Received withdrawals message.', { result });

    return result;
  }
}
