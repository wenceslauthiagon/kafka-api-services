import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetCompanyKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/payments-gateway/infrastructure';
import {
  GetCompanyRequest,
  GetCompanyResponse,
} from '@zro/payments-gateway/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.COMPANY.GET_COMPANY;

/**
 * Get company microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetCompanyServiceKafka {
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
      context: GetCompanyServiceKafka.name,
    });
  }

  /**
   * Call payments gateway microservice to GetCompany.
   * @param payload Data.
   */
  async execute(payload: GetCompanyRequest): Promise<GetCompanyResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetCompanyKafkaRequest = {
      key: `${payload.wallet_id}`,
      headers: { requestId: this.requestId },
      value: payload,
    };
    logger.debug('Send Deposit message.', { data });

    // Call GetCompany microservice.
    const result = await this.kafkaService.send<
      GetCompanyResponse,
      GetCompanyKafkaRequest
    >(SERVICE, data);

    logger.debug('Received Deposit message.', { result });

    return result;
  }
}
