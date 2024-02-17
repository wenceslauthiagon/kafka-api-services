import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetAllWarningPixDepositKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  GetAllWarningPixDepositRequest,
  GetAllWarningPixDepositResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.WARNING_PIX_DEPOSIT.GET_ALL;

/**
 * WarningPixDeposit microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetAllWarningPixDepositServiceKafka {
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
      context: GetAllWarningPixDepositServiceKafka.name,
    });
  }

  /**
   * Call WarningPixDeposits microservice to getAll.
   * @param payload Data.
   */
  async execute(
    payload: GetAllWarningPixDepositRequest,
  ): Promise<GetAllWarningPixDepositResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetAllWarningPixDepositKafkaRequest = {
      key: null,
      headers: { requestId: this.requestId },
      value: payload,
    };
    logger.debug('Send WarningPixDeposit message.', { data });

    // Call getAll WarningPixDeposit microservice.
    const result = await this.kafkaService.send<
      GetAllWarningPixDepositResponse,
      GetAllWarningPixDepositKafkaRequest
    >(SERVICE, data);

    logger.debug('Received WarningPixDeposit message.', { result });

    return result;
  }
}
