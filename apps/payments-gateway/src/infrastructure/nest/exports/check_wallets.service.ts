import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CheckWalletsKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/payments-gateway/infrastructure';
import {
  CheckWalletsRequest,
  CheckWalletsResponse,
} from '@zro/payments-gateway/interface';

// Service topic
const SERVICE = KAFKA_TOPICS.WALLET.CHECK;

/**
 * Check wallets microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CheckWalletsServiceKafka {
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
      context: CheckWalletsServiceKafka.name,
    });
  }

  /**
   * Call payments gateway microservice to CheckWallets.
   * @param payload Data.
   */
  async execute(payload: CheckWalletsRequest): Promise<CheckWalletsResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CheckWalletsKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send get wallets message.', { data });

    // Call CheckWallets microservice.
    const result = await this.kafkaService.send<
      CheckWalletsResponse,
      CheckWalletsKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get wallets message.', { result });

    return result;
  }
}
