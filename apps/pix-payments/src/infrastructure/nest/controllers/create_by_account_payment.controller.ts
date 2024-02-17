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
  DecodedPixAccountRepository,
  PaymentRepository,
} from '@zro/pix-payments/domain';
import {
  KAFKA_TOPICS,
  PaymentDatabaseRepository,
  PaymentEventKafkaEmitter,
  UserServiceKafka,
  OperationServiceKafka,
  DecodedPixAccountDatabaseRepository,
  DecodedPixAccountEventKafkaEmitter,
} from '@zro/pix-payments/infrastructure';
import {
  CreateByAccountPaymentRequest,
  CreateByAccountPaymentResponse,
  CreateByAccountPaymentController,
  PaymentEventEmitterControllerInterface,
  DecodedPixAccountEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type CreateByAccountPaymentKafkaRequest =
  KafkaMessage<CreateByAccountPaymentRequest>;

export type CreateByAccountPaymentKafkaResponse =
  KafkaResponse<CreateByAccountPaymentResponse>;

export interface PaymentOperationCreateByAccountConfig {
  APP_OPERATION_CURRENCY_TAG: string;
  APP_OPERATION_SEND_ACCOUNT_TRANSACTION_TAG: string;
}

/**
 * Payment controller.
 */
@Controller()
@MicroserviceController()
export class CreateByAccountPaymentMicroserviceController {
  private pixPaymentOperationCurrencyTag: string;
  private pixPaymentOperationSendAccountTransactionTag: string;
  /**
   * Default payment RPC controller constructor.
   */
  constructor(
    private configService: ConfigService<PaymentOperationCreateByAccountConfig>,
  ) {
    this.pixPaymentOperationCurrencyTag = this.configService.get<string>(
      'APP_OPERATION_CURRENCY_TAG',
    );
    this.pixPaymentOperationSendAccountTransactionTag =
      this.configService.get<string>(
        'APP_OPERATION_SEND_ACCOUNT_TRANSACTION_TAG',
      );

    if (
      !this.pixPaymentOperationCurrencyTag ||
      !this.pixPaymentOperationSendAccountTransactionTag
    ) {
      throw new MissingEnvVarException([
        ...(!this.pixPaymentOperationCurrencyTag
          ? ['APP_OPERATION_CURRENCY_TAG']
          : []),
        ...(!this.pixPaymentOperationSendAccountTransactionTag
          ? ['APP_OPERATION_SEND_ACCOUNT_TRANSACTION_TAG']
          : []),
      ]);
    }
  }

  /**
   * Consumer of create payment code.
   *
   * @param paymentRepository Payment repository.
   * @param decodedPixAccountRepository DecodedPixAccount repository.
   * @param paymentEmitter Payment event emitter.
   * @param decodedPixAccountEmitter DecodedPixKey event emitter.
   * @param userService User Service
   * @param operationService User Service
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.PAYMENT.CREATE_BY_ACCOUNT)
  async execute(
    @RepositoryParam(PaymentDatabaseRepository)
    paymentRepository: PaymentRepository,
    @RepositoryParam(DecodedPixAccountDatabaseRepository)
    decodedPixAccountRepository: DecodedPixAccountRepository,
    @EventEmitterParam(PaymentEventKafkaEmitter)
    paymentEmitter: PaymentEventEmitterControllerInterface,
    @EventEmitterParam(DecodedPixAccountEventKafkaEmitter)
    decodedPixAccountEmitter: DecodedPixAccountEventEmitterControllerInterface,
    @KafkaServiceParam(UserServiceKafka)
    userService: UserServiceKafka,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @LoggerParam(CreateByAccountPaymentMicroserviceController)
    logger: Logger,
    @Payload('value') message: CreateByAccountPaymentRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateByAccountPaymentKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CreateByAccountPaymentRequest(message);

    logger.info('Create payment from user.', { payload });

    // Create and call create payment by user and key controller.
    const controller = new CreateByAccountPaymentController(
      logger,
      paymentRepository,
      decodedPixAccountRepository,
      paymentEmitter,
      decodedPixAccountEmitter,
      userService,
      operationService,
      this.pixPaymentOperationCurrencyTag,
      this.pixPaymentOperationSendAccountTransactionTag,
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
