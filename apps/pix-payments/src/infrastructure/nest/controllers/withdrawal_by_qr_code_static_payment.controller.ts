import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  EventEmitterParam,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
  KafkaServiceParam,
  MissingEnvVarException,
} from '@zro/common';
import {
  DecodedQrCodeRepository,
  PaymentRepository,
} from '@zro/pix-payments/domain';
import {
  KAFKA_TOPICS,
  PaymentDatabaseRepository,
  PaymentEventKafkaEmitter,
  UserServiceKafka,
  OperationServiceKafka,
  DecodedQrCodeDatabaseRepository,
  BankingServiceKafka,
} from '@zro/pix-payments/infrastructure';
import {
  WithdrawalByQrCodeStaticPaymentRequest,
  WithdrawalByQrCodeStaticPaymentResponse,
  WithdrawalByQrCodeStaticPaymentController,
  PaymentEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type WithdrawalByQrCodeStaticPaymentKafkaRequest =
  KafkaMessage<WithdrawalByQrCodeStaticPaymentRequest>;

export type WithdrawalByQrCodeStaticPaymentKafkaResponse =
  KafkaResponse<WithdrawalByQrCodeStaticPaymentResponse>;

export interface PaymentOperationWithdrawalByQrCodeStaticConfig {
  APP_OPERATION_CURRENCY_TAG: string;
  APP_OPERATION_WITHDRAWAL_QRS_TRANSACTION_TAG: string;
  APP_AGENT_MOD_WITHDRAWAL: string;
}

/**
 * Payment controller.
 */
@Controller()
@MicroserviceController()
export class WithdrawalByQrCodeStaticPaymentMicroserviceController {
  private pixPaymentOperationCurrencyTag: string;
  private pixPaymentOperationWithdrawalQrsTransactionTag: string;
  private pixPaymentAgentModWithdrawal: string;

  /**
   * Default payment RPC controller constructor.
   */
  constructor(
    private configService: ConfigService<PaymentOperationWithdrawalByQrCodeStaticConfig>,
  ) {
    this.pixPaymentOperationCurrencyTag = this.configService.get<string>(
      'APP_OPERATION_CURRENCY_TAG',
    );
    this.pixPaymentOperationWithdrawalQrsTransactionTag =
      this.configService.get<string>(
        'APP_OPERATION_WITHDRAWAL_QRS_TRANSACTION_TAG',
      );
    this.pixPaymentAgentModWithdrawal = this.configService.get<string>(
      'APP_AGENT_MOD_WITHDRAWAL',
    );

    if (
      !this.pixPaymentOperationCurrencyTag ||
      !this.pixPaymentOperationWithdrawalQrsTransactionTag ||
      !this.pixPaymentAgentModWithdrawal
    ) {
      throw new MissingEnvVarException([
        ...(!this.pixPaymentOperationCurrencyTag
          ? ['APP_OPERATION_CURRENCY_TAG']
          : []),
        ...(!this.pixPaymentOperationWithdrawalQrsTransactionTag
          ? ['APP_OPERATION_WITHDRAWAL_QRS_TRANSACTION_TAG']
          : []),
        ...(!this.pixPaymentAgentModWithdrawal
          ? ['APP_AGENT_MOD_WITHDRAWAL']
          : []),
      ]);
    }
  }

  /**
   * Consumer of create payment code.
   *
   * @param paymentRepository Payment repository.
   * @param decodedQrCodeRepository DecodedQrCode repository.
   * @param eventEmitter Payment event emitter.
   * @param userService User Service
   * @param operationService User Service
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.PAYMENT.WITHDRAWAL_BY_QR_CODE_STATIC)
  async execute(
    @RepositoryParam(PaymentDatabaseRepository)
    paymentRepository: PaymentRepository,
    @RepositoryParam(DecodedQrCodeDatabaseRepository)
    decodedQrCodeRepository: DecodedQrCodeRepository,
    @EventEmitterParam(PaymentEventKafkaEmitter)
    eventEmitter: PaymentEventEmitterControllerInterface,
    @KafkaServiceParam(UserServiceKafka)
    userService: UserServiceKafka,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @KafkaServiceParam(BankingServiceKafka)
    bankingService: BankingServiceKafka,
    @LoggerParam(WithdrawalByQrCodeStaticPaymentMicroserviceController)
    logger: Logger,
    @Payload('value') message: WithdrawalByQrCodeStaticPaymentRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<WithdrawalByQrCodeStaticPaymentKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new WithdrawalByQrCodeStaticPaymentRequest(message);

    logger.info('Withdrawal qr code static payment from user.', { payload });

    // Create and call withdrawal by qr code static payment by user and key controller.
    const controller = new WithdrawalByQrCodeStaticPaymentController(
      logger,
      paymentRepository,
      decodedQrCodeRepository,
      eventEmitter,
      userService,
      operationService,
      bankingService,
      this.pixPaymentOperationCurrencyTag,
      this.pixPaymentOperationWithdrawalQrsTransactionTag,
      this.pixPaymentAgentModWithdrawal,
    );

    // Create payment
    const payment = await controller.execute(payload);

    logger.info('Payment created.', { payment });

    return {
      ctx,
      value: payment,
    };
  }
}
