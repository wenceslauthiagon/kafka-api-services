import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  GetQrCodeDynamicDueDateByIdKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  GetQrCodeDynamicDueDateByIdRequest,
  GetQrCodeDynamicDueDateByIdResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.QR_CODE_DYNAMIC_DUE_DATE.GET_BY_ID;

/**
 * QrCodeDynamicDueDate microservice.
 */
@KafkaSubscribeService(SERVICE)
export class GetQrCodeDynamicDueDateByIdServiceKafka {
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
      context: GetQrCodeDynamicDueDateByIdServiceKafka.name,
    });
  }

  /**
   * Call QrCodeDynamics microservice to get a QrCodeDynamicDueDate by id.
   * @param payload Data.
   */
  async execute(
    payload: GetQrCodeDynamicDueDateByIdRequest,
  ): Promise<GetQrCodeDynamicDueDateByIdResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: GetQrCodeDynamicDueDateByIdKafkaRequest = {
      key: payload.id,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Send QrCodeDynamicDueDate message.', { data });

    // Call get QrCodeDynamicDueDate by id microservice.
    const result = await this.kafkaService.send<
      GetQrCodeDynamicDueDateByIdResponse,
      GetQrCodeDynamicDueDateByIdKafkaRequest
    >(SERVICE, data);

    logger.debug('Received QrCodeDynamicDueDate message.', { result });

    return result;
  }
}
