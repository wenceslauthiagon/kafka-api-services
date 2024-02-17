import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  CreateByQrCodeDynamicPaymentKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  CreateByQrCodeDynamicPaymentRequest,
  CreateByQrCodeDynamicPaymentResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.PAYMENT.CREATE_BY_QR_CODE_DYNAMIC;

/**
 * Payment microservice.
 */
@KafkaSubscribeService(SERVICE)
export class CreateByQrCodeDynamicPaymentServiceKafka {
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
      context: CreateByQrCodeDynamicPaymentServiceKafka.name,
    });
  }

  /**
   * Call pix payment microservice to create a payment.
   * @param payload Data.
   */
  async execute(
    payload: CreateByQrCodeDynamicPaymentRequest,
  ): Promise<CreateByQrCodeDynamicPaymentResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: CreateByQrCodeDynamicPaymentKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Create by qr code dynamic Payment message.', { data });

    // Call create Payment message.
    const result = await this.kafkaService.send<
      CreateByQrCodeDynamicPaymentResponse,
      CreateByQrCodeDynamicPaymentKafkaRequest
    >(SERVICE, data);

    logger.debug('Created Payment message.', result);

    return result;
  }
}
