import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetAllPixDepositByWalletKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  GetAllPixDepositByWalletRequest,
  GetAllPixDepositByWalletResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.PIX_DEPOSIT.GET_ALL_BY_WALLET;

/**
 * Pix deposit microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetAllPixDepositByWalletServiceKafka {
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
      context: GetAllPixDepositByWalletServiceKafka.name,
    });
  }

  /**
   * Call deposits microservice to getAll.
   * @param payload Data.
   */
  async execute(
    payload: GetAllPixDepositByWalletRequest,
  ): Promise<GetAllPixDepositByWalletResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetAllPixDepositByWalletKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };
    logger.debug('Send deposit message.', { data });

    // Call getAll PixDeposit microservice.
    const result = await this.kafkaService.send<
      GetAllPixDepositByWalletResponse,
      GetAllPixDepositByWalletKafkaRequest
    >(SERVICE, data);

    logger.debug('Received deposit message.', { result });

    return result;
  }
}
