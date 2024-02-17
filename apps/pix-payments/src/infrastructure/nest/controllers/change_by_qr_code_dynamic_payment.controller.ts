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
  ChangeByQrCodeDynamicPaymentRequest,
  ChangeByQrCodeDynamicPaymentResponse,
  ChangeByQrCodeDynamicPaymentController,
  PaymentEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type ChangeByQrCodeDynamicPaymentKafkaRequest =
  KafkaMessage<ChangeByQrCodeDynamicPaymentRequest>;

export type ChangeByQrCodeDynamicPaymentKafkaResponse =
  KafkaResponse<ChangeByQrCodeDynamicPaymentResponse>;

export interface PaymentOperationChangeByQrCodeDynamicConfig {
  APP_OPERATION_CURRENCY_TAG: string;
  APP_OPERATION_CHANGE_QRD_TRANSACTION_TAG: string;
}

/**
 * Payment controller.
 */
@Controller()
@MicroserviceController()
export class ChangeByQrCodeDynamicPaymentMicroserviceController {
  private pixPaymentOperationCurrencyTag: string;
  private pixPaymentOperationChangeQrdTransactionTag: string;

  /**
   * Default payment RPC controller constructor.
   */
  constructor(
    private configService: ConfigService<PaymentOperationChangeByQrCodeDynamicConfig>,
  ) {
    this.pixPaymentOperationCurrencyTag = this.configService.get<string>(
      'APP_OPERATION_CURRENCY_TAG',
    );
    this.pixPaymentOperationChangeQrdTransactionTag =
      this.configService.get<string>(
        'APP_OPERATION_CHANGE_QRD_TRANSACTION_TAG',
      );

    if (
      !this.pixPaymentOperationCurrencyTag ||
      !this.pixPaymentOperationChangeQrdTransactionTag
    ) {
      throw new MissingEnvVarException([
        ...(!this.pixPaymentOperationCurrencyTag
          ? ['APP_OPERATION_CURRENCY_TAG']
          : []),
        ...(!this.pixPaymentOperationChangeQrdTransactionTag
          ? ['APP_OPERATION_CHANGE_QRD_TRANSACTION_TAG']
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
  @KafkaMessagePattern(KAFKA_TOPICS.PAYMENT.CHANGE_BY_QR_CODE_DYNAMIC)
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
    @LoggerParam(ChangeByQrCodeDynamicPaymentMicroserviceController)
    logger: Logger,
    @Payload('value') message: ChangeByQrCodeDynamicPaymentRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<ChangeByQrCodeDynamicPaymentKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new ChangeByQrCodeDynamicPaymentRequest(message);

    logger.info('Change qr code dynamic payment from user.', { payload });

    // Create and call change by qr code dynamic payment by user and key controller.
    const controller = new ChangeByQrCodeDynamicPaymentController(
      logger,
      paymentRepository,
      decodedQrCodeRepository,
      eventEmitter,
      userService,
      operationService,
      this.pixPaymentOperationCurrencyTag,
      this.pixPaymentOperationChangeQrdTransactionTag,
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
