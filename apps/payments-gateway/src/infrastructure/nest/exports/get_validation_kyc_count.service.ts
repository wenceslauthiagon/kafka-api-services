import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetValidationKycCountKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/payments-gateway/infrastructure';
import {
  GetValidationKycCountRequest,
  GetValidationKycCountResponse,
} from '@zro/payments-gateway/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.VALIDATION.KYC_COUNT;

/**
 * Get validation kyc count microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetValidationKycCountServiceKafka {
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
      context: GetValidationKycCountServiceKafka.name,
    });
  }

  /**
   * Call payments gateway microservice to GetValidationKycCount.
   * @param payload Data.
   */
  async execute(
    payload: GetValidationKycCountRequest,
  ): Promise<GetValidationKycCountResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetValidationKycCountKafkaRequest = {
      key: `${payload.wallet_id}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send get validation kyc count message.', { data });

    // Call GetValidationKycCount microservice.
    const result = await this.kafkaService.send<
      GetValidationKycCountResponse,
      GetValidationKycCountKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get validation kyc count message.', {
      result,
    });

    return result;
  }
}
