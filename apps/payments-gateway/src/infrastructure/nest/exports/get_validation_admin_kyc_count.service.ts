import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetValidationAdminKycCountKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/payments-gateway/infrastructure';
import {
  GetValidationAdminKycCountRequest,
  GetValidationAdminKycCountResponse,
} from '@zro/payments-gateway/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.VALIDATION.ADMIN_KYC_COUNT;

/**
 * Get validation admin kyc count microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetValidationAdminKycCountServiceKafka {
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
      context: GetValidationAdminKycCountServiceKafka.name,
    });
  }

  /**
   * Call payments gateway microservice to GetValidationAdminKycCount.
   * @param payload Data.
   */
  async execute(
    payload: GetValidationAdminKycCountRequest,
  ): Promise<GetValidationAdminKycCountResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetValidationAdminKycCountKafkaRequest = {
      key: `${payload.wallet_id}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send get validation admin kyc count message.', { data });

    // Call GetValidationKycCount microservice.
    const result = await this.kafkaService.send<
      GetValidationAdminKycCountResponse,
      GetValidationAdminKycCountKafkaRequest
    >(SERVICE, data);

    logger.debug('Received get validation admin kyc count message.', {
      result,
    });

    return result;
  }
}
