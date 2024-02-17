import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  DuedateByQrCodeDynamicPaymentKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  DuedateByQrCodeDynamicPaymentRequest,
  DuedateByQrCodeDynamicPaymentResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.PAYMENT.DUEDATE_BY_QR_CODE_DYNAMIC;

/**
 * Payment microservice.
 */
@KafkaSubscribeService(SERVICE)
export class DuedateByQrCodeDynamicPaymentServiceKafka {
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
      context: DuedateByQrCodeDynamicPaymentServiceKafka.name,
    });
  }

  /**
   * Call pix payment microservice to duedate a payment.
   * @param payload Data.
   */
  async execute(
    payload: DuedateByQrCodeDynamicPaymentRequest,
  ): Promise<DuedateByQrCodeDynamicPaymentResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: DuedateByQrCodeDynamicPaymentKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Duedate by qr code dynamic Payment message.', { data });

    // Call duedate Payment message.
    const result = await this.kafkaService.send<
      DuedateByQrCodeDynamicPaymentResponse,
      DuedateByQrCodeDynamicPaymentKafkaRequest
    >(SERVICE, data);

    logger.debug('Duedated Payment message.', result);

    return result;
  }
}
