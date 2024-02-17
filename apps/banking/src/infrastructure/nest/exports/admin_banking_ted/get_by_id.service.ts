import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetAdminBankingTedByIdKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/banking/infrastructure';
import {
  GetAdminBankingTedByIdRequest,
  GetAdminBankingTedByIdResponse,
} from '@zro/banking/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.ADMIN_BANKING_TED.GET_BY_ID;

/**
 * Get adminBankingTed by id microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetAdminBankingTedByIdServiceKafka {
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
    this.logger = logger.child({
      context: GetAdminBankingTedByIdServiceKafka.name,
    });
  }

  /**
   * Call banking microservice to get a adminBankingTed.
   * @param payload Data.
   */
  async execute(
    payload: GetAdminBankingTedByIdRequest,
  ): Promise<GetAdminBankingTedByIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetAdminBankingTedByIdKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send adminBankingTed message.', { data });

    // Call get banking microservice.
    const result = await this.kafkaService.send<
      GetAdminBankingTedByIdResponse,
      GetAdminBankingTedByIdKafkaRequest
    >(SERVICE, data);

    logger.debug('Received adminBankingTed message.', { result });

    return result;
  }
}
