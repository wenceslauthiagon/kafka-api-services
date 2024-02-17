import { Logger } from 'winston';

import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetAllPixDepositKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  GetAllPixDepositRequest,
  GetAllPixDepositResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.PIX_DEPOSIT.GET_ALL;

/**
 * Pix deposit microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetAllPixDepositServiceKafka {
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
    this.logger = logger.child({ context: GetAllPixDepositServiceKafka.name });
  }

  /**
   * Call deposits microservice to getAll.
   * @param payload Data.
   */
  async execute(
    payload: GetAllPixDepositRequest,
  ): Promise<GetAllPixDepositResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetAllPixDepositKafkaRequest = {
      key: null,
      headers: { requestId: this.requestId },
      value: payload,
    };
    logger.debug('Send deposit message.', { data });

    // Call getAll PixDeposit microservice.
    const result = await this.kafkaService.send<
      GetAllPixDepositResponse,
      GetAllPixDepositKafkaRequest
    >(SERVICE, data);

    logger.debug('Received deposit message.', { result });

    return result;
  }
}
