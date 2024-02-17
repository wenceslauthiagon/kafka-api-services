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
  CreateByQrCodeStaticPaymentRequest,
  CreateByQrCodeStaticPaymentResponse,
  CreateByQrCodeStaticPaymentController,
  PaymentEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type CreateByQrCodeStaticPaymentKafkaRequest =
  KafkaMessage<CreateByQrCodeStaticPaymentRequest>;

export type CreateByQrCodeStaticPaymentKafkaResponse =
  KafkaResponse<CreateByQrCodeStaticPaymentResponse>;

export interface PaymentOperationCreateByQrCodeStaticConfig {
  APP_OPERATION_CURRENCY_TAG: string;
  APP_OPERATION_SEND_QRS_TRANSACTION_TAG: string;
}

/**
 * Payment controller.
 */
@Controller()
@MicroserviceController()
export class CreateByQrCodeStaticPaymentMicroserviceController {
  private pixPaymentOperationCurrencyTag: string;
  private pixPaymentOperationSendQrsTransactionTag: string;

  /**
   * Default payment RPC controller constructor.
   */
  constructor(
    private configService: ConfigService<PaymentOperationCreateByQrCodeStaticConfig>,
  ) {
    this.pixPaymentOperationCurrencyTag = this.configService.get<string>(
      'APP_OPERATION_CURRENCY_TAG',
    );
    this.pixPaymentOperationSendQrsTransactionTag =
      this.configService.get<string>('APP_OPERATION_SEND_QRS_TRANSACTION_TAG');

    if (
      !this.pixPaymentOperationCurrencyTag ||
      !this.pixPaymentOperationSendQrsTransactionTag
    ) {
      throw new MissingEnvVarException([
        ...(!this.pixPaymentOperationCurrencyTag
          ? ['APP_OPERATION_CURRENCY_TAG']
          : []),
        ...(!this.pixPaymentOperationSendQrsTransactionTag
          ? ['APP_OPERATION_SEND_QRS_TRANSACTION_TAG']
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
  @KafkaMessagePattern(KAFKA_TOPICS.PAYMENT.CREATE_BY_QR_CODE_STATIC)
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
    @LoggerParam(CreateByQrCodeStaticPaymentMicroserviceController)
    logger: Logger,
    @Payload('value') message: CreateByQrCodeStaticPaymentRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateByQrCodeStaticPaymentKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CreateByQrCodeStaticPaymentRequest(message);

    logger.info('Create qr code static payment from user.', { payload });

    // Create and call create by qr code static payment by user and key controller.
    const controller = new CreateByQrCodeStaticPaymentController(
      logger,
      paymentRepository,
      decodedQrCodeRepository,
      eventEmitter,
      userService,
      operationService,
      this.pixPaymentOperationCurrencyTag,
      this.pixPaymentOperationSendQrsTransactionTag,
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
