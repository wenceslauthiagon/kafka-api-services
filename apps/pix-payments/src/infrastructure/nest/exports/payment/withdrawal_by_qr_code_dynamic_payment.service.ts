import { Logger } from 'winston';
import { KafkaService, KafkaSubscribeService } from '@zro/common';
import {
  WithdrawalByQrCodeDynamicPaymentKafkaRequest,
  KAFKA_TOPICS,
} from '@zro/pix-payments/infrastructure';
import {
  WithdrawalByQrCodeDynamicPaymentRequest,
  WithdrawalByQrCodeDynamicPaymentResponse,
} from '@zro/pix-payments/interface';

// Service topic.
const SERVICE = KAFKA_TOPICS.PAYMENT.WITHDRAWAL_BY_QR_CODE_DYNAMIC;

/**
 * Payment microservice.
 */
@KafkaSubscribeService(SERVICE)
export class WithdrawalByQrCodeDynamicPaymentServiceKafka {
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
      context: WithdrawalByQrCodeDynamicPaymentServiceKafka.name,
    });
  }

  /**
   * Call pix payment microservice to create or schedule a payment.
   * @param payload Data.
   */
  async execute(
    payload: WithdrawalByQrCodeDynamicPaymentRequest,
  ): Promise<WithdrawalByQrCodeDynamicPaymentResponse> {
    const logger = this.logger.child({ loggerId: this.requestId });

    // Request Kafka message.
    const data: WithdrawalByQrCodeDynamicPaymentKafkaRequest = {
      key: `${payload.userId}`,
      headers: { requestId: this.requestId },
      value: payload,
    };

    logger.debug('Withdrawal by qr code dynamic Payment message.', { data });

    // Call create Payment message.
    const result = await this.kafkaService.send<
      WithdrawalByQrCodeDynamicPaymentResponse,
      WithdrawalByQrCodeDynamicPaymentKafkaRequest
    >(SERVICE, data);

    logger.debug('Created Payment message.', result);

    return result;
  }
}
