import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetAllPaymentByWalletKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  GetAllPaymentByWalletRequest,
  GetAllPaymentByWalletResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.PAYMENT.GET_ALL_BY_WALLET;

/**
 * Payment microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetAllPaymentByWalletServiceKafka {
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
      context: GetAllPaymentByWalletServiceKafka.name,
    });
  }

  /**
   * Call payments microservice to getAll.
   * @param payload Data.
   */
  async execute(
    payload: GetAllPaymentByWalletRequest,
  ): Promise<GetAllPaymentByWalletResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetAllPaymentByWalletKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };
    logger.debug('Send payment message.', { data });

    // Call getAll Payment microservice.
    const result = await this.kafkaService.send<
      GetAllPaymentByWalletResponse,
      GetAllPaymentByWalletKafkaRequest
    >(SERVICE, data);

    logger.debug('Received payment message.', { result });

    return result;
  }
}
