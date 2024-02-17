import { Logger } from 'winston';

import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetByQrCodeStaticIdKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  GetByQrCodeStaticIdRequest,
  GetByQrCodeStaticIdResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.QR_CODE_STATIC.GET_BY_ID;

/**
 * QrCodeStatic microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetByQrCodeStaticIdServiceKafka {
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
      context: GetByQrCodeStaticIdServiceKafka.name,
    });
  }

  /**
   * Call qrCodeStatics microservice to getById.
   * @param payload Data.
   */
  async execute(
    payload: GetByQrCodeStaticIdRequest,
  ): Promise<GetByQrCodeStaticIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetByQrCodeStaticIdKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };
    logger.debug('Send qrCodeStatic message.', { data });

    // Call getById QrCodeStatic microservice.
    const result = await this.kafkaService.send<
      GetByQrCodeStaticIdResponse,
      GetByQrCodeStaticIdKafkaRequest
    >(SERVICE, data);

    logger.debug('Received qrCodeStatic message.', { result });

    return result;
  }
}
