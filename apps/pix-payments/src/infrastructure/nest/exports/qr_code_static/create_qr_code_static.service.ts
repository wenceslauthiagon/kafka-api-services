import { Logger } from 'winston';

import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateQrCodeStaticKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  CreateQrCodeStaticRequest,
  CreateQrCodeStaticResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.QR_CODE_STATIC.CREATE;

/**
 * QrCodeStatic microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CreateQrCodeStaticServiceKafka {
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
      context: CreateQrCodeStaticServiceKafka.name,
    });
  }

  /**
   * Call QrCodeStatics microservice to create a QrCodeStatic.
   * @param payload Data.
   */
  async execute(
    payload: CreateQrCodeStaticRequest,
  ): Promise<CreateQrCodeStaticResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreateQrCodeStaticKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send QrCodeStatic message.', { data });

    // Call create QrCodeStatic microservice.
    const result = await this.kafkaService.send<
      CreateQrCodeStaticResponse,
      CreateQrCodeStaticKafkaRequest
    >(SERVICE, data);

    logger.debug('Received QrCodeStatic message.', { result });

    return result;
  }
}
