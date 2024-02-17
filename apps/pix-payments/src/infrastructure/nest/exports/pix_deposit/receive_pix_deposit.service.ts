import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  ReceivePixDepositKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  ReceivePixDepositRequest,
  ReceivePixDepositResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.PIX_DEPOSIT.RECEIVE;

/**
 * PixDeposit microservice.
 */
@KafkaSubscribeService(SERVICE)
export class ReceivePixDepositServiceKafka {
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
    this.logger = logger.child({ context: ReceivePixDepositServiceKafka.name });
  }

  /**
   * Call PixDeposit microservice to create a PixDeposit.
   * @param payload Data.
   */
  async execute(
    payload: ReceivePixDepositRequest,
  ): Promise<ReceivePixDepositResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: ReceivePixDepositKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send PixDeposit message.', { data });

    // Call create PixDeposit microservice.
    const result = await this.kafkaService.send<
      ReceivePixDepositResponse,
      ReceivePixDepositKafkaRequest
    >(SERVICE, data);

    logger.debug('Received PixDeposit message.', { result });

    return result;
  }
}
