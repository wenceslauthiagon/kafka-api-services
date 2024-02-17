import { Logger } from 'winston';
import { ConfigService } from '@nestjs/config';
import { Controller } from '@nestjs/common';
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
  DuedateByQrCodeDynamicPaymentRequest,
  DuedateByQrCodeDynamicPaymentResponse,
  DuedateByQrCodeDynamicPaymentController,
  PaymentEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type DuedateByQrCodeDynamicPaymentKafkaRequest =
  KafkaMessage<DuedateByQrCodeDynamicPaymentRequest>;

export type DuedateByQrCodeDynamicPaymentKafkaResponse =
  KafkaResponse<DuedateByQrCodeDynamicPaymentResponse>;

export interface PaymentOperationDuedateByQrCodeDynamicConfig {
  APP_OPERATION_CURRENCY_TAG: string;
  APP_OPERATION_DUEDATE_QRD_TRANSACTION_TAG: string;
}

/**
 * Payment controller.
 */
@Controller()
@MicroserviceController()
export class DuedateByQrCodeDynamicPaymentMicroserviceController {
  private pixPaymentOperationCurrencyTag: string;
  private pixPaymentOperationDuedateQrdTransactionTag: string;

  /**
   * Default payment RPC controller constructor.
   */
  constructor(
    private configService: ConfigService<PaymentOperationDuedateByQrCodeDynamicConfig>,
  ) {
    this.pixPaymentOperationCurrencyTag = this.configService.get<string>(
      'APP_OPERATION_CURRENCY_TAG',
    );
    this.pixPaymentOperationDuedateQrdTransactionTag =
      this.configService.get<string>(
        'APP_OPERATION_DUEDATE_QRD_TRANSACTION_TAG',
      );

    if (
      !this.pixPaymentOperationCurrencyTag ||
      !this.pixPaymentOperationDuedateQrdTransactionTag
    ) {
      throw new MissingEnvVarException([
        ...(!this.pixPaymentOperationCurrencyTag
          ? ['APP_OPERATION_CURRENCY_TAG']
          : []),
        ...(!this.pixPaymentOperationDuedateQrdTransactionTag
          ? ['APP_OPERATION_DUEDATE_QRD_TRANSACTION_TAG']
          : []),
      ]);
    }
  }

  /**
   * Consumer of duedate payment code.
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
  @KafkaMessagePattern(KAFKA_TOPICS.PAYMENT.DUEDATE_BY_QR_CODE_DYNAMIC)
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
    @LoggerParam(DuedateByQrCodeDynamicPaymentMicroserviceController)
    logger: Logger,
    @Payload('value') message: DuedateByQrCodeDynamicPaymentRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<DuedateByQrCodeDynamicPaymentKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new DuedateByQrCodeDynamicPaymentRequest(message);

    logger.info('Duedate qr code dynamic payment from user.', { payload });

    // Duedate and call duedate by qr code dynamic payment by user and key controller.
    const controller = new DuedateByQrCodeDynamicPaymentController(
      logger,
      paymentRepository,
      decodedQrCodeRepository,
      eventEmitter,
      userService,
      operationService,
      this.pixPaymentOperationCurrencyTag,
      this.pixPaymentOperationDuedateQrdTransactionTag,
    );

    // Duedate payment
    const payment = await controller.execute(payload);

    logger.info('Payment duedated.', { payment });

    return {
      ctx,
      value: payment,
    };
  }
}
