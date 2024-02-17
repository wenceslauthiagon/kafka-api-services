import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import {
  KafkaMessage,
  KafkaResponse,
  KafkaMessagePattern,
  EventEmitterParam,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
  KafkaServiceParam,
  MissingEnvVarException,
} from '@zro/common';
import { TopazioKycGatewayParam, TopazioKycInterceptor } from '@zro/topazio';
import {
  DecodedPixAccountRepository,
  PaymentRepository,
} from '@zro/pix-payments/domain';
import {
  KAFKA_TOPICS,
  UserServiceKafka,
  DecodedPixAccountDatabaseRepository,
  DecodedPixAccountEventKafkaEmitter,
  BankingServiceKafka,
  PaymentDatabaseRepository,
  PaymentEventKafkaEmitter,
  OperationServiceKafka,
} from '@zro/pix-payments/infrastructure';
import {
  CreateByAccountAndDecodedPaymentController,
  CreateByAccountAndDecodedPaymentRequest,
  CreateByAccountAndDecodedPaymentResponse,
  DecodedPixAccountEventEmitterControllerInterface,
  PaymentEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import { KycGateway } from '@zro/pix-payments/application';

export type CreateByAccountAndDecodedPaymentKafkaRequest =
  KafkaMessage<CreateByAccountAndDecodedPaymentRequest>;

export type CreateByAccountAndDecodedPaymentKafkaResponse =
  KafkaResponse<CreateByAccountAndDecodedPaymentResponse>;

interface CreateByAccountAndDecodedPaymentConfig {
  APP_PIX_DECODED_ACCOUNT_MAX_NUMBER_PENDING_PER_DAY: number;
  APP_ZROBANK_ISPB: string;
  APP_OPERATION_CURRENCY_TAG: string;
  APP_OPERATION_SEND_ACCOUNT_TRANSACTION_TAG: string;
}

/**
 * CreateByAccountAndDecodedPayment controller.
 */
@Controller()
@MicroserviceController([TopazioKycInterceptor])
export class CreateByAccountAndDecodedPaymentMicroserviceController {
  private pixDecodedAccountMaxNumberPendingPerDay: number;
  private pixPaymentZroBankIspb: string;
  private pixPaymentOperationCurrencyTag: string;
  private pixPaymentOperationSendAccountTransactionTag: string;

  /**
   * Default payment RPC controller constructor.
   */
  constructor(
    private configService: ConfigService<CreateByAccountAndDecodedPaymentConfig>,
  ) {
    this.pixDecodedAccountMaxNumberPendingPerDay =
      this.configService.get<number>(
        'APP_PIX_DECODED_ACCOUNT_MAX_NUMBER_PENDING_PER_DAY',
        20,
      );

    this.pixPaymentZroBankIspb =
      this.configService.get<string>('APP_ZROBANK_ISPB');

    this.pixPaymentOperationCurrencyTag = this.configService.get<string>(
      'APP_OPERATION_CURRENCY_TAG',
    );
    this.pixPaymentOperationSendAccountTransactionTag =
      this.configService.get<string>(
        'APP_OPERATION_SEND_ACCOUNT_TRANSACTION_TAG',
      );

    if (
      !this.pixDecodedAccountMaxNumberPendingPerDay ||
      !this.pixPaymentZroBankIspb ||
      !this.pixPaymentOperationCurrencyTag ||
      !this.pixPaymentOperationSendAccountTransactionTag
    ) {
      throw new MissingEnvVarException([
        ...(!this.pixDecodedAccountMaxNumberPendingPerDay
          ? ['APP_PIX_DECODED_ACCOUNT_MAX_NUMBER_PENDING_PER_DAY']
          : []),
        ...(!this.pixPaymentZroBankIspb ? ['APP_ZROBANK_ISPB'] : []),
        ...(!this.pixPaymentOperationCurrencyTag
          ? ['APP_OPERATION_CURRENCY_TAG']
          : []),
        ...(!this.pixPaymentOperationSendAccountTransactionTag
          ? ['APP_OPERATION_SEND_ACCOUNT_TRANSACTION_TAG']
          : []),
      ]);
    }
  }

  @KafkaMessagePattern(KAFKA_TOPICS.PAYMENT.CREATE_BY_ACCOUNT_AND_DECODED)
  async execute(
    @LoggerParam(CreateByAccountAndDecodedPaymentMicroserviceController)
    logger: Logger,
    @TopazioKycGatewayParam()
    kycGateway: KycGateway,
    @RepositoryParam(PaymentDatabaseRepository)
    paymentRepository: PaymentRepository,
    @RepositoryParam(DecodedPixAccountDatabaseRepository)
    decodedPixAccountRepository: DecodedPixAccountRepository,
    @EventEmitterParam(PaymentEventKafkaEmitter)
    paymentEventEmitter: PaymentEventEmitterControllerInterface,
    @EventEmitterParam(DecodedPixAccountEventKafkaEmitter)
    decodedPixAccountEventEmitter: DecodedPixAccountEventEmitterControllerInterface,
    @KafkaServiceParam(UserServiceKafka)
    userService: UserServiceKafka,
    @KafkaServiceParam(BankingServiceKafka)
    bankingService: BankingServiceKafka,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @Payload('value') message: CreateByAccountAndDecodedPaymentRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateByAccountAndDecodedPaymentKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CreateByAccountAndDecodedPaymentRequest(message);

    logger.info('Create by account and decode payment to user.', { payload });

    // Create and call decode account by user and key controller.
    const controller = new CreateByAccountAndDecodedPaymentController(
      logger,
      kycGateway,
      paymentRepository,
      decodedPixAccountRepository,
      paymentEventEmitter,
      decodedPixAccountEventEmitter,
      userService,
      operationService,
      bankingService,
      this.pixPaymentOperationCurrencyTag,
      this.pixPaymentOperationSendAccountTransactionTag,
      this.pixDecodedAccountMaxNumberPendingPerDay,
      this.pixPaymentZroBankIspb,
    );

    // Create a DecodedPixAccount And Payment
    const response = await controller.execute(payload);

    logger.info('Created by account and decoded payment.', {
      response,
    });

    return {
      ctx,
      value: response,
    };
  }
}
