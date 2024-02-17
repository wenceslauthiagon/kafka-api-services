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
import { PaymentRepository } from '@zro/pix-payments/domain';
import {
  KAFKA_TOPICS,
  PaymentDatabaseRepository,
  PaymentEventKafkaEmitter,
  UserServiceKafka,
  OperationServiceKafka,
  BankingServiceKafka,
  PixKeyServiceKafka,
} from '@zro/pix-payments/infrastructure';
import {
  CreateByPixKeyPaymentRequest,
  CreateByPixKeyPaymentResponse,
  CreateByPixKeyPaymentController,
  PaymentEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type CreateByPixKeyPaymentKafkaRequest =
  KafkaMessage<CreateByPixKeyPaymentRequest>;

export type CreateByPixKeyPaymentKafkaResponse =
  KafkaResponse<CreateByPixKeyPaymentResponse>;

export interface PaymentOperationCreateByPixKeyConfig {
  APP_OPERATION_CURRENCY_TAG: string;
  APP_OPERATION_SEND_KEY_TRANSACTION_TAG: string;
}

/**
 * Payment controller.
 */
@Controller()
@MicroserviceController()
export class CreateByPixKeyPaymentMicroserviceController {
  private pixPaymentOperationCurrencyTag: string;
  private pixPaymentOperationSendKeyTransactionTag: string;

  /**
   * Default payment RPC controller constructor.
   */
  constructor(
    private configService: ConfigService<PaymentOperationCreateByPixKeyConfig>,
  ) {
    this.pixPaymentOperationCurrencyTag = this.configService.get<string>(
      'APP_OPERATION_CURRENCY_TAG',
    );
    this.pixPaymentOperationSendKeyTransactionTag =
      this.configService.get<string>('APP_OPERATION_SEND_KEY_TRANSACTION_TAG');
    if (
      !this.pixPaymentOperationCurrencyTag ||
      !this.pixPaymentOperationSendKeyTransactionTag
    ) {
      throw new MissingEnvVarException([
        ...(!this.pixPaymentOperationCurrencyTag
          ? ['APP_OPERATION_CURRENCY_TAG']
          : []),
        ...(!this.pixPaymentOperationSendKeyTransactionTag
          ? ['APP_OPERATION_SEND_KEY_TRANSACTION_TAG']
          : []),
      ]);
    }
  }

  /**
   * Consumer of create payment code.
   * @param logger Global logger instance.
   * @param paymentRepository Payment repository.
   * @param paymentEmitter Payment event emitter.
   * @param decodedPixKeyEmitter DecodedPixKey event emitter.
   * @param pixKeyService Pix key service gateway.
   * @param userService User service gateway.
   * @param operationService Operation service gateway.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.PAYMENT.CREATE_BY_PIX_KEY)
  async execute(
    @RepositoryParam(PaymentDatabaseRepository)
    paymentRepository: PaymentRepository,
    @EventEmitterParam(PaymentEventKafkaEmitter)
    paymentEmitter: PaymentEventEmitterControllerInterface,
    @KafkaServiceParam(PixKeyServiceKafka)
    pixKeyService: PixKeyServiceKafka,
    @KafkaServiceParam(UserServiceKafka)
    userService: UserServiceKafka,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @KafkaServiceParam(BankingServiceKafka)
    bankingService: BankingServiceKafka,
    @LoggerParam(CreateByPixKeyPaymentMicroserviceController)
    logger: Logger,
    @Payload('value') message: CreateByPixKeyPaymentRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateByPixKeyPaymentKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CreateByPixKeyPaymentRequest(message);

    logger.info('Create payment by pix key from user.', { payload });

    // Create and call create payment by user and key controller.
    const controller = new CreateByPixKeyPaymentController(
      logger,
      paymentRepository,
      paymentEmitter,
      pixKeyService,
      userService,
      operationService,
      bankingService,
      this.pixPaymentOperationCurrencyTag,
      this.pixPaymentOperationSendKeyTransactionTag,
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
