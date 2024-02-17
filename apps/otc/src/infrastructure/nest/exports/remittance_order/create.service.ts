import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateRemittanceOrderRequest,
  CreateRemittanceOrderResponse,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  CreateRemittanceOrderKafkaRequest,
} from '@zro/otc/infrastructure';

/**
 * Create RemittanceOrder.
 */
const SERVICE = KAFKA_TOPICS.REMITTANCE_ORDER.CREATE;

@KafkaSubscribeService(SERVICE)
export class CreateRemittanceOrderServiceKafka {
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
      context: CreateRemittanceOrderServiceKafka.name,
    });
  }

  /**
   * Call otc microservice
   * @param payload Data.
   */
  async execute(
    payload: CreateRemittanceOrderRequest,
  ): Promise<CreateRemittanceOrderResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreateRemittanceOrderKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Create remittance order message.', { data });

    // Call otc microservice.
    const result = await this.kafkaService.send<
      CreateRemittanceOrderResponse,
      CreateRemittanceOrderKafkaRequest
    >(SERVICE, data);

    logger.debug('Created remittance order message.', result);

    return result;
  }
}
