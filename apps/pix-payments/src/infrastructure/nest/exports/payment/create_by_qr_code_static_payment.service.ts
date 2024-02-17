import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateByQrCodeStaticPaymentKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  CreateByQrCodeStaticPaymentRequest,
  CreateByQrCodeStaticPaymentResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.PAYMENT.CREATE_BY_QR_CODE_STATIC;

/**
 * Payment microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CreateByQrCodeStaticPaymentServiceKafka {
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
      context: CreateByQrCodeStaticPaymentServiceKafka.name,
    });
  }

  /**
   * Call pix payment microservice to create or schedule a payment.
   * @param payload Data.
   */
  async execute(
    payload: CreateByQrCodeStaticPaymentRequest,
  ): Promise<CreateByQrCodeStaticPaymentResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreateByQrCodeStaticPaymentKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Create by qr code static Payment message.', { data });

    // Call create Payment message.
    const result = await this.kafkaService.send<
      CreateByQrCodeStaticPaymentResponse,
      CreateByQrCodeStaticPaymentKafkaRequest
    >(SERVICE, data);

    logger.debug('Created Payment message.', result);

    return result;
  }
}
