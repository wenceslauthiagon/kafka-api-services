import { Logger } from 'winston';
import { ConfigService } from '@nestjs/config';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  EventEmitterParam,
  KafkaService,
  LoggerParam,
  RepositoryParam,
  ObserverController,
  KafkaServiceParam,
  TranslateService,
  FailedEntity,
} from '@zro/common';
import {
  JdpiPixPaymentInterceptor,
  JdpiPixPaymentGatewayParam,
} from '@zro/jdpi';
import {
  PaymentRepository,
  PixDepositRepository,
} from '@zro/pix-payments/domain';
import { PixPaymentGateway } from '@zro/pix-payments/application';
import {
  PixDepositDatabaseRepository,
  PaymentDatabaseRepository,
  PaymentEventKafkaEmitter,
  KAFKA_EVENTS,
  KAFKA_HUB,
  OperationServiceKafka,
  BankingServiceKafka,
  PixDepositEventKafkaEmitter,
} from '@zro/pix-payments/infrastructure';
import {
  HandlePendingPaymentEventController,
  PaymentEventEmitterControllerInterface,
  HandlePendingPaymentEventRequest,
  PixDepositEventEmitterControllerInterface,
  HandleRevertPaymentEventRequest,
} from '@zro/pix-payments/interface';

export type HandlePendingPaymentEventKafkaRequest =
  KafkaMessage<HandlePendingPaymentEventRequest>;

interface PaymentOperationConfig {
  APP_OPERATION_CURRENCY_TAG: string;
  APP_OPERATION_DESCRIPTION: string;
  APP_OPERATION_PIX_RECEIVED_DEPOSIT_TRANSACTION_TAG: string;
  APP_ZROBANK_ISPB: string;
  APP_OPERATION_PIX_CHANGE_TRANSACTION_TAG: string;
}

/**
 * Payment pending events observer.
 */
@Controller()
@ObserverController([JdpiPixPaymentInterceptor])
export class PendingPaymentNestObserver {
  private pixPaymentOperationCurrencyTag: string;
  private pixPaymentOperationDescription: string;
  private pixPaymentOperationNewPixReceivedTransactionTag: string;
  private pixPaymentZroBankIspb: string;
  private pixPaymentOperationChangeTransactionTag: string;

  constructor(
    private kafkaService: KafkaService,
    private configService: ConfigService<PaymentOperationConfig>,
    private translateService: TranslateService,
  ) {
    this.pixPaymentOperationCurrencyTag = this.configService.get<string>(
      'APP_OPERATION_CURRENCY_TAG',
    );
    this.pixPaymentOperationDescription = this.configService.get<string>(
      'APP_OPERATION_DESCRIPTION',
    );
    this.pixPaymentOperationNewPixReceivedTransactionTag =
      this.configService.get<string>(
        'APP_OPERATION_PIX_RECEIVED_DEPOSIT_TRANSACTION_TAG',
      );
    this.pixPaymentZroBankIspb =
      this.configService.get<string>('APP_ZROBANK_ISPB');
    this.pixPaymentOperationChangeTransactionTag =
      this.configService.get<string>(
        'APP_OPERATION_PIX_CHANGE_TRANSACTION_TAG',
      );
    this.kafkaService.createEvents([KAFKA_HUB.PAYMENT.PENDING.TOPAZIO_GATEWAY]);
  }

  /**
   * Handler triggered when payment is pending.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.PAYMENT.PENDING)
  async handlePendingPaymentEvent(
    @Payload('value') message: HandlePendingPaymentEventRequest,
    @LoggerParam(PendingPaymentNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.info('Received added payment event.', { value: message });

    // Select topazio gateway to add Payment.
    await this.kafkaService.emit(
      KAFKA_HUB.PAYMENT.PENDING.TOPAZIO_GATEWAY,
      ctx.getMessage(),
    );
  }

  /**
   * Handler triggered when payment is pending.
   *
   * @param message Event Kafka message.
   * @param paymentRepository Payment repository.
   * @param depositRepository Deposit repository.
   * @param paymentServiceEventEmitter Payment emitter.
   * @param depositServiceEventEmitter Deposit emitter.
   * @param pspGateway Payment psp gateway.
   * @param operationService Operation service.
   * @param bankingService Banking service.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.PAYMENT.PENDING.TOPAZIO_GATEWAY)
  async handlePendingPaymentEventViaTopazio(
    @Payload('value') message: HandlePendingPaymentEventRequest,
    @RepositoryParam(PaymentDatabaseRepository)
    paymentRepository: PaymentRepository,
    @RepositoryParam(PixDepositDatabaseRepository)
    depositRepository: PixDepositRepository,
    @EventEmitterParam(PaymentEventKafkaEmitter)
    paymentServiceEventEmitter: PaymentEventEmitterControllerInterface,
    @EventEmitterParam(PixDepositEventKafkaEmitter)
    depositServiceEventEmitter: PixDepositEventEmitterControllerInterface,
    @JdpiPixPaymentGatewayParam()
    pspGateway: PixPaymentGateway,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @KafkaServiceParam(BankingServiceKafka)
    bankingService: BankingServiceKafka,
    @LoggerParam(PendingPaymentNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandlePendingPaymentEventRequest(message);

    logger.info('Handle added event pending payment.', { payload });

    const controller = new HandlePendingPaymentEventController(
      logger,
      paymentRepository,
      depositRepository,
      paymentServiceEventEmitter,
      pspGateway,
      operationService,
      bankingService,
      depositServiceEventEmitter,
      this.pixPaymentOperationCurrencyTag,
      this.pixPaymentOperationDescription,
      this.pixPaymentOperationNewPixReceivedTransactionTag,
      this.pixPaymentZroBankIspb,
      this.pixPaymentOperationChangeTransactionTag,
    );

    try {
      // Call the payment controller.
      const result = await controller.execute(payload);

      logger.info('Payment result.', { result });
    } catch (error) {
      const logError = error.data?.isAxiosError ? error.data.message : error;
      logger.error('Failed to add payment.', { error: logError });

      const errorMessage = await this.translateService.translateException(
        'default_exceptions',
        error,
      );
      const failed = new FailedEntity({
        code: error.code,
        message: errorMessage,
      });
      const value: HandleRevertPaymentEventRequest = {
        ...message,
        failed,
      };

      await this.kafkaService.emit(KAFKA_EVENTS.PAYMENT.REVERTED, {
        ...ctx.getMessage(),
        value,
      });
    }
  }
}
