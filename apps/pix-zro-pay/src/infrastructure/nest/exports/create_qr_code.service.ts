import { Logger } from 'winston';

import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateQrCodeKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-zro-pay/infrastructure';
import {
  CreateQrCodeRequest,
  CreateQrCodeResponse,
} from '@zro/pix-zro-pay/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.QR_CODE.CREATE;

/**
 * QrCode microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CreateQrCodeServiceKafka {
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
      context: CreateQrCodeServiceKafka.name,
    });
  }

  /**
   * Call QrCodes microservice to create a QrCode.
   * @param payload Data.
   */
  async execute(payload: CreateQrCodeRequest): Promise<CreateQrCodeResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreateQrCodeKafkaRequest = {
      key: `${payload.merchantId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send QrCode message.', { data });

    // Call create QrCode microservice.
    const result = await this.kafkaService.send<
      CreateQrCodeResponse,
      CreateQrCodeKafkaRequest
    >(SERVICE, data);

    logger.debug('Received QrCode message.', { result });

    return result;
  }
}
