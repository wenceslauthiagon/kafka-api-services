import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  ChangeByQrCodeDynamicPaymentKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  ChangeByQrCodeDynamicPaymentRequest,
  ChangeByQrCodeDynamicPaymentResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.PAYMENT.CHANGE_BY_QR_CODE_DYNAMIC;

/**
 * Payment microservice.
 */
@KafkaSubscribeService(SERVICE)
export class ChangeByQrCodeDynamicPaymentServiceKafka {
  /**
   * Default constructor.
   * @param requestId Unique shared request ID.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private requestId: string,
    private logger: Logger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger = logger.child({
      context: ChangeByQrCodeDynamicPaymentServiceKafka.name,
    });
  }

  /**
   * Call pix payment microservice to create or schedule a payment.
   * @param payload Data.
   */
  async execute(
    payload: ChangeByQrCodeDynamicPaymentRequest,
  ): Promise<ChangeByQrCodeDynamicPaymentResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: ChangeByQrCodeDynamicPaymentKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Change by qr code dynamic Payment message.', { data });

    // Call create Payment message.
    const result = await this.kafkaService.send<
      ChangeByQrCodeDynamicPaymentResponse,
      ChangeByQrCodeDynamicPaymentKafkaRequest
    >(SERVICE, data);

    logger.debug('Created Payment message.', result);

    return result;
  }
}
