import { Logger } from 'winston';

import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetCompanyByIdAndXApiKeyKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-zro-pay/infrastructure';
import {
  GetCompanyByIdAndXApiKeyRequest,
  GetCompanyByIdAndXApiKeyResponse,
} from '@zro/pix-zro-pay/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.COMPANY.GET_BY_ID_AND_X_API_KEY;

/**
 * Company microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetCompanyByIdAndXApiKeyServiceKafka {
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
      context: GetCompanyByIdAndXApiKeyServiceKafka.name,
    });
  }

  /**
   * Call Companys microservice to get a Company.
   * @param payload Data.
   */
  async execute(
    payload: GetCompanyByIdAndXApiKeyRequest,
  ): Promise<GetCompanyByIdAndXApiKeyResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetCompanyByIdAndXApiKeyKafkaRequest = {
      key: `${payload.id}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send Company message.', { data });

    // Call get Company microservice.
    const result = await this.kafkaService.send<
      GetCompanyByIdAndXApiKeyResponse,
      GetCompanyByIdAndXApiKeyKafkaRequest
    >(SERVICE, data);

    logger.debug('Received Company message.', { result });

    return result;
  }
}
