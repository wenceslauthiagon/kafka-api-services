import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  WithdrawalByQrCodeStaticPaymentKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  WithdrawalByQrCodeStaticPaymentRequest,
  WithdrawalByQrCodeStaticPaymentResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.PAYMENT.WITHDRAWAL_BY_QR_CODE_STATIC;

/**
 * Payment microservice.
 */
@KafkaSubscribeService(SERVICE)
export class WithdrawalByQrCodeStaticPaymentServiceKafka {
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
      context: WithdrawalByQrCodeStaticPaymentServiceKafka.name,
    });
  }

  /**
   * Call pix payment microservice to create or schedule a payment.
   * @param payload Data.
   */
  async execute(
    payload: WithdrawalByQrCodeStaticPaymentRequest,
  ): Promise<WithdrawalByQrCodeStaticPaymentResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: WithdrawalByQrCodeStaticPaymentKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Withdrawal by qr code static Payment message.', { data });

    // Call create Payment message.
    const result = await this.kafkaService.send<
      WithdrawalByQrCodeStaticPaymentResponse,
      WithdrawalByQrCodeStaticPaymentKafkaRequest
    >(SERVICE, data);

    logger.debug('Created Payment message.', result);

    return result;
  }
}
