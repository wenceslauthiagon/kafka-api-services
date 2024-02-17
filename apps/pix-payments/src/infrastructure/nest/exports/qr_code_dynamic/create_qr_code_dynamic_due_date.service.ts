import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateQrCodeDynamicDueDateKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  CreateQrCodeDynamicDueDateRequest,
  CreateQrCodeDynamicDueDateResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.QR_CODE_DYNAMIC_DUE_DATE.CREATE;

/**
 * QrCodeDynamicDueDate microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CreateQrCodeDynamicDueDateServiceKafka {
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
      context: CreateQrCodeDynamicDueDateServiceKafka.name,
    });
  }

  /**
   * Call QrCodeDynamics microservice to create a QrCodeDynamicDueDate.
   * @param payload Data.
   */
  async execute(
    payload: CreateQrCodeDynamicDueDateRequest,
  ): Promise<CreateQrCodeDynamicDueDateResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreateQrCodeDynamicDueDateKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send QrCodeDynamicDueDate message.', { data });

    // Call create QrCodeDynamicDueDate microservice.
    const result = await this.kafkaService.send<
      CreateQrCodeDynamicDueDateResponse,
      CreateQrCodeDynamicDueDateKafkaRequest
    >(SERVICE, data);

    logger.debug('Received QrCodeDynamicDueDate message.', { result });

    return result;
  }
}
