import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetBankByIdKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/banking/infrastructure';
import {
  GetBankByIdRequest,
  GetBankByIdResponse,
} from '@zro/banking/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.BANK.GET_BY_ID;

/**
 * Get bank by id microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetBankByIdServiceKafka {
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
    this.logger = logger.child({ context: GetBankByIdServiceKafka.name });
  }

  /**
   * Call banks microservice to get a bank.
   * @param payload Data.
   */
  async execute(payload: GetBankByIdRequest): Promise<GetBankByIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetBankByIdKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send bank message.', { data });

    // Call create bank microservice.
    const result = await this.kafkaService.send<
      GetBankByIdResponse,
      GetBankByIdKafkaRequest
    >(SERVICE, data);

    logger.debug('Received bank message.', { result });

    return result;
  }
}
