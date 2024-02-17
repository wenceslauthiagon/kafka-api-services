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
} from '@zro/pix-payments/infrastructure';
import {
  WithdrawalByQrCodeDynamicPaymentRequest,
  WithdrawalByQrCodeDynamicPaymentResponse,
  WithdrawalByQrCodeDynamicPaymentController,
  PaymentEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type WithdrawalByQrCodeDynamicPaymentKafkaRequest =
  KafkaMessage<WithdrawalByQrCodeDynamicPaymentRequest>;

export type WithdrawalByQrCodeDynamicPaymentKafkaResponse =
  KafkaResponse<WithdrawalByQrCodeDynamicPaymentResponse>;

export interface PaymentOperationWithdrawalByQrCodeDynamicConfig {
  APP_OPERATION_CURRENCY_TAG: string;
  APP_OPERATION_WITHDRAWAL_QRD_TRANSACTION_TAG: string;
}

/**
 * Payment controller.
 */
@Controller()
@MicroserviceController()
export class WithdrawalByQrCodeDynamicPaymentMicroserviceController {
  private pixPaymentOperationCurrencyTag: string;
  private pixPaymentOperationWithdrawalQrdTransactionTag: string;

  /**
   * Default payment RPC controller constructor.
   */
  constructor(
    private configService: ConfigService<PaymentOperationWithdrawalByQrCodeDynamicConfig>,
  ) {
    this.pixPaymentOperationCurrencyTag = this.configService.get<string>(
      'APP_OPERATION_CURRENCY_TAG',
    );
    this.pixPaymentOperationWithdrawalQrdTransactionTag =
      this.configService.get<string>(
        'APP_OPERATION_WITHDRAWAL_QRD_TRANSACTION_TAG',
      );

    if (
      !this.pixPaymentOperationCurrencyTag ||
      !this.pixPaymentOperationWithdrawalQrdTransactionTag
    ) {
      throw new MissingEnvVarException([
        ...(!this.pixPaymentOperationCurrencyTag
          ? ['APP_OPERATION_CURRENCY_TAG']
          : []),
        ...(!this.pixPaymentOperationWithdrawalQrdTransactionTag
          ? ['APP_OPERATION_WITHDRAWAL_QRD_TRANSACTION_TAG']
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
  @KafkaMessagePattern(KAFKA_TOPICS.PAYMENT.WITHDRAWAL_BY_QR_CODE_DYNAMIC)
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
    @LoggerParam(WithdrawalByQrCodeDynamicPaymentMicroserviceController)
    logger: Logger,
    @Payload('value') message: WithdrawalByQrCodeDynamicPaymentRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<WithdrawalByQrCodeDynamicPaymentKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new WithdrawalByQrCodeDynamicPaymentRequest(message);

    logger.info('Withdrawal qr code dynamic payment from user.', { payload });

    // Create and call withdrawal by qr code dynamic payment by user and key controller.
    const controller = new WithdrawalByQrCodeDynamicPaymentController(
      logger,
      paymentRepository,
      decodedQrCodeRepository,
      eventEmitter,
      userService,
      operationService,
      this.pixPaymentOperationCurrencyTag,
      this.pixPaymentOperationWithdrawalQrdTransactionTag,
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
