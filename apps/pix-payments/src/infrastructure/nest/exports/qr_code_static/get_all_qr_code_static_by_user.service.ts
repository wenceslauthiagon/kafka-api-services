import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetAllQrCodeStaticByUserKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  GetAllQrCodeStaticByUserRequest,
  GetAllQrCodeStaticByUserResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.QR_CODE_STATIC.GET_ALL_BY_USER;

/**
 * QrCodeStatic microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetAllQrCodeStaticByUserServiceKafka {
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
      context: GetAllQrCodeStaticByUserServiceKafka.name,
    });
  }

  /**
   * Call qrCodeStatics microservice to getAll.
   * @param payload Data.
   */
  async execute(
    payload: GetAllQrCodeStaticByUserRequest,
  ): Promise<GetAllQrCodeStaticByUserResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetAllQrCodeStaticByUserKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };
    logger.debug('Send qrCodeStatic message.', { data });

    // Call getAll QrCodeStatic microservice.
    const result = await this.kafkaService.send<
      GetAllQrCodeStaticByUserResponse,
      GetAllQrCodeStaticByUserKafkaRequest
    >(SERVICE, data);

    logger.debug('Received qrCodeStatic message.', { result });

    return result;
  }
}
