import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  KAFKA_TOPICS,
  BlockPixDepositKafkaRequest,
} from '@zro/pix-payments/infrastructure';
import {
  BlockPixDepositRequest,
  BlockPixDepositResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.PIX_DEPOSIT.BLOCK;

/**
 * Service to call pix-payments microservice to block pix deposit.
 *
 * This class must be created for each request.
 */
@KafkaSubscribeService(SERVICE)
export class BlockPixDepositServiceKafka {
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
      context: BlockPixDepositServiceKafka.name,
    });
  }

  /**
   * Call pix-payments microservice to block pix deposit.
   * @param payload Data.
   */
  async execute(
    payload: BlockPixDepositRequest,
  ): Promise<BlockPixDepositResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: BlockPixDepositKafkaRequest = {
      key: `${payload.operationId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send block pix deposit request message.', { data });

    // Call pix-payments microservice to block pix deposit.
    const result = await this.kafkaService.send<
      BlockPixDepositResponse,
      BlockPixDepositKafkaRequest
    >(SERVICE, data);

    logger.debug('Received block pix deposit message.', { result });

    return result;
  }
}
