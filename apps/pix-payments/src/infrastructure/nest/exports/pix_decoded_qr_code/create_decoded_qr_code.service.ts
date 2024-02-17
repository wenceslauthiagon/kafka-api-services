import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateDecodedQrCodeKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  CreateDecodedQrCodeRequest,
  CreateDecodedQrCodeResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.DECODED_QR_CODE.CREATE;

/**
 * Create decoded qr code microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CreateDecodedQrCodeServiceKafka {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private requestId: string,
    private logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({
      context: CreateDecodedQrCodeServiceKafka.name,
    });
  }

  /**
   * Call pix-payments microservice to decode qr code.
   * @param payload Data.
   */
  async execute(
    payload: CreateDecodedQrCodeRequest,
  ): Promise<CreateDecodedQrCodeResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreateDecodedQrCodeKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send decoded qr code message.', { data });

    // Call pix-payments microservice.
    const result = await this.kafkaService.send<
      CreateDecodedQrCodeResponse,
      CreateDecodedQrCodeKafkaRequest
    >(SERVICE, data);

    logger.debug('Received decoded qr code message.', { result });

    return result;
  }
}
