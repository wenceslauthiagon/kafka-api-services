import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateQrCodeDynamicInstantBillingKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  CreateQrCodeDynamicInstantBillingRequest,
  CreateQrCodeDynamicInstantBillingResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.QR_CODE_DYNAMIC.CREATE;

/**
 * QrCodeDynamic microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CreateQrCodeDynamicServiceKafka {
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
      context: CreateQrCodeDynamicServiceKafka.name,
    });
  }

  /**
   * Call QrCodeDynamics microservice to create a QrCodeDynamic.
   * @param payload Data.
   */
  async execute(
    payload: CreateQrCodeDynamicInstantBillingRequest,
  ): Promise<CreateQrCodeDynamicInstantBillingResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreateQrCodeDynamicInstantBillingKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send QrCodeDynamic message.', { data });

    // Call create QrCodeDynamic microservice.
    const result = await this.kafkaService.send<
      CreateQrCodeDynamicInstantBillingResponse,
      CreateQrCodeDynamicInstantBillingKafkaRequest
    >(SERVICE, data);

    logger.debug('Received QrCodeDynamic message.', { result });

    return result;
  }
}
