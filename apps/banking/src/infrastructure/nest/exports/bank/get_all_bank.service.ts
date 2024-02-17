import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetAllBankKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/banking/infrastructure';
import { GetAllBankRequest, GetAllBankResponse } from '@zro/banking/interface';

/**
 * Bank microservice.
 */
@KafkaSubscribeService([KAFKA_TOPICS.BANK.GET_ALL])
export class GetAllBankServiceKafka {
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
    this.logger = logger.child({ context: GetAllBankServiceKafka.name });
  }

  /**
   * Call banks microservice to getAll.
   * @param payload Data.
   */
  async execute(payload: GetAllBankRequest): Promise<GetAllBankResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetAllBankKafkaRequest = {
      key: `${this.requestId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };
    logger.debug('Send bank message.');

    // Call Banking microservice.
    const result = await this.kafkaService.send<
      GetAllBankResponse,
      GetAllBankKafkaRequest
    >(KAFKA_TOPICS.BANK.GET_ALL, data);

    logger.debug('Received bank message.', result);

    return result;
  }
}
