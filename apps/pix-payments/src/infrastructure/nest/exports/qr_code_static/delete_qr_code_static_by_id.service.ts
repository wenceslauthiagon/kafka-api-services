import { Logger } from 'winston';

import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  DeleteByQrCodeStaticIdKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import { DeleteByQrCodeStaticIdRequest } from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.QR_CODE_STATIC.DELETE_BY_ID;

/**
 * QrCodeStatic microservice.
 */
@KafkaSubscribeService(SERVICE)
export class DeleteByQrCodeStaticIdServiceKafka {
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
      context: DeleteByQrCodeStaticIdServiceKafka.name,
    });
  }

  /**
   * Call QrCodeStatics microservice to delete a QrCodeStatic.
   * @param payload Data.
   */
  async execute(payload: DeleteByQrCodeStaticIdRequest): Promise<void> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: DeleteByQrCodeStaticIdKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send qrCodeStatic message.', { data });

    // Call delete QrCodeStatic microservice.
    await this.kafkaService.send<void, DeleteByQrCodeStaticIdKafkaRequest>(
      SERVICE,
      data,
    );

    logger.debug('Received qrCodeStatic message.');
  }
}
