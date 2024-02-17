import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateCashbackRequest,
  CreateCashbackResponse,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  CreateCashbackKafkaRequest,
} from '@zro/otc/infrastructure';

/**
 * Create Cashback.
 */
const SERVICE = KAFKA_TOPICS.CASHBACK.CREATE;

@KafkaSubscribeService(SERVICE)
export class CreateCashbackServiceKafka {
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
      context: CreateCashbackServiceKafka.name,
    });
  }

  /**
   * Call otc microservice
   * @param payload Data.
   */
  async execute(
    payload: CreateCashbackRequest,
  ): Promise<CreateCashbackResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreateCashbackKafkaRequest = {
      key: payload.userId,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Create cashback message.', { data });

    // Call otc microservice.
    const result = await this.kafkaService.send<
      CreateCashbackResponse,
      CreateCashbackKafkaRequest
    >(SERVICE, data);

    logger.debug('Created cashback message.', { result });

    return result;
  }
}
