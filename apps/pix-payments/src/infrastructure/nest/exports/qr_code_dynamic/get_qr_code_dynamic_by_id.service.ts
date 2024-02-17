import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetQrCodeDynamicByIdKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  GetQrCodeDynamicByIdRequest,
  GetQrCodeDynamicByIdResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.QR_CODE_DYNAMIC.GET_BY_ID;

/**
 * QrCodeDynamic microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetQrCodeDynamicByIdServiceKafka {
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
      context: GetQrCodeDynamicByIdServiceKafka.name,
    });
  }

  /**
   * Call QrCodeDynamics microservice to get a QrCodeDynamic by id.
   * @param payload Data.
   */
  async execute(
    payload: GetQrCodeDynamicByIdRequest,
  ): Promise<GetQrCodeDynamicByIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetQrCodeDynamicByIdKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send QrCodeDynamic message.', { data });

    // Call get QrCodeDynamic by id microservice.
    const result = await this.kafkaService.send<
      GetQrCodeDynamicByIdResponse,
      GetQrCodeDynamicByIdKafkaRequest
    >(SERVICE, data);

    logger.debug('Received QrCodeDynamic message.', { result });

    return result;
  }
}
