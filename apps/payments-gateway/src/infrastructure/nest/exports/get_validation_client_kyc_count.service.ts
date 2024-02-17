import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetValidationClientKycCountKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/payments-gateway/infrastructure';
import {
  GetValidationClientKycCountRequest,
  GetValidationClientKycCountResponse,
} from '@zro/payments-gateway/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.VALIDATION.CLIENT_KYC_COUNT;

/**
 * Get validation client kyc count microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetValidationClientKycCountServiceKafka {
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
      context: GetValidationClientKycCountServiceKafka.name,
    });
  }

  /**
   * Call payments gateway microservice to GetValidationClientKycCount.
   * @param payload Data.
   */
  async execute(
    payload: GetValidationClientKycCountRequest,
  ): Promise<GetValidationClientKycCountResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetValidationClientKycCountKafkaRequest = {
      key: `${payload.wallet_id}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send get validation client kyc count message.', { data });

    // Call GetValidationClientKycCount microservice.
    const result = await this.kafkaService.send<
      GetValidationClientKycCountResponse,
      GetValidationClientKycCountKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get validation client kyc count message.', {
      result,
    });

    return result;
  }
}
