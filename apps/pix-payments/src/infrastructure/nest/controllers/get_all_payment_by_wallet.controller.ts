import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  KafkaServiceParam,
  LoggerParam,
  MicroserviceController,
  MissingEnvVarException,
  RepositoryParam,
} from '@zro/common';
import { PaymentRepository } from '@zro/pix-payments/domain';
import { BankingService } from '@zro/pix-payments/application';
import {
  GetAllPaymentByWalletController,
  GetAllPaymentByWalletRequest,
  GetAllPaymentByWalletResponse,
} from '@zro/pix-payments/interface';
import {
  BankingServiceKafka,
  KAFKA_TOPICS,
  PaymentDatabaseRepository,
} from '@zro/pix-payments/infrastructure';

export type GetAllPaymentByWalletKafkaRequest =
  KafkaMessage<GetAllPaymentByWalletRequest>;

export type GetAllPaymentByWalletKafkaResponse =
  KafkaResponse<GetAllPaymentByWalletResponse>;

interface OwnerBankConfig {
  APP_ZROBANK_ISPB: string;
}

/**
 * Payment controller.
 */
@Controller()
@MicroserviceController()
export class GetAllPaymentByWalletMicroserviceController {
  private readonly ownerBankIspb: string;

  /**
   * Default devolution RPC controller constructor.
   */
  constructor(private configService: ConfigService<OwnerBankConfig>) {
    this.ownerBankIspb = this.configService.get<string>('APP_ZROBANK_ISPB');

    if (!this.ownerBankIspb) {
      throw new MissingEnvVarException('APP_ZROBANK_ISPB');
    }
  }

  /**
   * Consumer of get payments.
   *
   * @param paymentRepository Payment repository.
   * @param bankingService Banking service.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.PAYMENT.GET_ALL_BY_WALLET)
  async execute(
    @RepositoryParam(PaymentDatabaseRepository)
    paymentRepository: PaymentRepository,
    @KafkaServiceParam(BankingServiceKafka)
    bankingService: BankingService,
    @LoggerParam(GetAllPaymentByWalletMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAllPaymentByWalletRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAllPaymentByWalletKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAllPaymentByWalletRequest(message);

    // Create and call get payments controller.
    const controller = new GetAllPaymentByWalletController(
      logger,
      paymentRepository,
      bankingService,
      this.ownerBankIspb,
    );

    // Get payments
    const payments = await controller.execute(payload);

    logger.info('Payments found.', { payments });

    return {
      ctx,
      value: payments,
    };
  }
}
