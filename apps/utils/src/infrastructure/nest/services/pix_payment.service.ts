import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import { Wallet } from '@zro/operations/domain';
import { Payment, PaymentEntity } from '@zro/pix-payments/domain';
import { PixPaymentService } from '@zro/utils/application';
import { CreateByPixKeyPaymentRequest } from '@zro/pix-payments/interface';
import { CreateByPixKeyPaymentServiceKafka } from '@zro/pix-payments/infrastructure';

/**
 * Pix payment microservice
 */
export class PixPaymentServiceKafka implements PixPaymentService {
  static _services: any[] = [CreateByPixKeyPaymentServiceKafka];

  private readonly createByPixKeyService: CreateByPixKeyPaymentServiceKafka;

  /**
   * Default constructor.
   * @param requestId The request id.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private requestId: string,
    private logger: Logger,
    private kafkaService: KafkaService,
  ) {
    this.logger = logger.child({ context: PixPaymentServiceKafka.name });

    this.createByPixKeyService = new CreateByPixKeyPaymentServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );
  }

  /**
   * Create pix payment by pix key.
   * @param wallet Wallet.
   * @param payment Pix payment.
   * @returns Pix payment created.
   */
  async createByPixKey(wallet: Wallet, payment: Payment): Promise<Payment> {
    const request: CreateByPixKeyPaymentRequest = {
      id: payment.id,
      userId: payment.user.uuid,
      walletId: wallet.uuid,
      decodedPixKeyId: payment.decodedPixKey.id,
      value: payment.value,
      description: payment.description,
    };

    const result = await this.createByPixKeyService.execute(request);

    const response = result && new PaymentEntity(result);

    return response;
  }
}
