import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
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
  PixDevolutionReceivedRepository,
  PixDevolutionRepository,
} from '@zro/pix-payments/domain';
import { PixPaymentGateway } from '@zro/pix-payments/application';
import {
  PixDevolutionDatabaseRepository,
  PixDepositDatabaseRepository,
  PixDevolutionEventKafkaEmitter,
  KAFKA_EVENTS,
  KAFKA_HUB,
  OperationServiceKafka,
  PaymentDatabaseRepository,
  PixDevolutionReceivedDatabaseRepository,
  PixDevolutionReceivedEventKafkaEmitter,
} from '@zro/pix-payments/infrastructure';
import {
  HandlePendingPixDevolutionEventController,
  PixDevolutionEventEmitterControllerInterface,
  HandlePendingPixDevolutionEventRequest,
  PixDevolutionReceivedEventEmitterControllerInterface,
  HandleRevertPixDevolutionEventRequest,
} from '@zro/pix-payments/interface';

export type HandlePendingPixDevolutionEventKafkaRequest =
  KafkaMessage<HandlePendingPixDevolutionEventRequest>;

interface PixDevolutionOperationConfig {
  APP_OPERATION_CURRENCY_TAG: string;
  APP_OPERATION_SEND_DEVOLUTION_TRANSACTION_TAG: string;
  APP_ZROBANK_ISPB: string;
  APP_OPERATION_PIX_DEVOLUTION_RECEIVED_TRANSACTION_TAG: string;
}

/**
 * PixDevolution pending events observer.
 */
@Controller()
@ObserverController([JdpiPixPaymentInterceptor])
export class PendingPixDevolutionNestObserver {
  private pixSendDevolutionOperationCurrencyTag: string;
  private pixSendDevolutionOperationTransactionTag: string;
  private pixDevolutionZroBankIspb: string;
  private pixDevolutionReceivedOperationTransactionTag: string;

  constructor(
    private kafkaService: KafkaService,
    private configService: ConfigService<PixDevolutionOperationConfig>,
    private translateService: TranslateService,
  ) {
    this.pixSendDevolutionOperationCurrencyTag = this.configService.get<string>(
      'APP_OPERATION_CURRENCY_TAG',
    );
    this.pixSendDevolutionOperationTransactionTag =
      this.configService.get<string>(
        'APP_OPERATION_SEND_DEVOLUTION_TRANSACTION_TAG',
      );
    this.pixDevolutionZroBankIspb =
      this.configService.get<string>('APP_ZROBANK_ISPB');
    this.pixDevolutionReceivedOperationTransactionTag =
      this.configService.get<string>(
        'APP_OPERATION_PIX_DEVOLUTION_RECEIVED_TRANSACTION_TAG',
      );
    this.kafkaService.createEvents([
      KAFKA_HUB.PIX_DEVOLUTION.PENDING.TOPAZIO_GATEWAY,
    ]);
  }

  /**
   * Handler triggered when devolution is pending.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.PIX_DEVOLUTION.PENDING)
  async handlePendingPixDevolutionEvent(
    @Payload('value') message: HandlePendingPixDevolutionEventRequest,
    @LoggerParam(PendingPixDevolutionNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.info('Received added pixDevolution event.', { value: message });

    // Select topazio gateway to add PixDevolution.
    await this.kafkaService.emit(
      KAFKA_HUB.PIX_DEVOLUTION.PENDING.TOPAZIO_GATEWAY,
      ctx.getMessage(),
    );
  }

  /**
   * Handler triggered when devolution is pending.
   *
   * @param message Event Kafka message.
   * @param devolutionRepository PixDevolution repository.
   * @param depositRepository PixDeposit repository.
   * @param serviceEventEmitter Event emitter.
   * @param pspGateway PixDevolution psp gateway.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.PIX_DEVOLUTION.PENDING.TOPAZIO_GATEWAY)
  async handlePendingPixDevolutionEventViaTopazio(
    @Payload('value') message: HandlePendingPixDevolutionEventRequest,
    @RepositoryParam(PixDevolutionDatabaseRepository)
    devolutionRepository: PixDevolutionRepository,
    @RepositoryParam(PixDepositDatabaseRepository)
    depositRepository: PixDepositRepository,
    @EventEmitterParam(PixDevolutionEventKafkaEmitter)
    serviceEventEmitter: PixDevolutionEventEmitterControllerInterface,
    @JdpiPixPaymentGatewayParam()
    pspGateway: PixPaymentGateway,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @RepositoryParam(PaymentDatabaseRepository)
    paymentRepository: PaymentRepository,
    @RepositoryParam(PixDevolutionReceivedDatabaseRepository)
    devolutionReceivedRepository: PixDevolutionReceivedRepository,
    @EventEmitterParam(PixDevolutionReceivedEventKafkaEmitter)
    serviceDevolutionReceivedEventEmitter: PixDevolutionReceivedEventEmitterControllerInterface,
    @LoggerParam(PendingPixDevolutionNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandlePendingPixDevolutionEventRequest(message);

    logger.info('Handle added event pending pixDevolution.', { payload });

    const controller = new HandlePendingPixDevolutionEventController(
      logger,
      devolutionRepository,
      depositRepository,
      serviceEventEmitter,
      pspGateway,
      operationService,
      paymentRepository,
      devolutionReceivedRepository,
      serviceDevolutionReceivedEventEmitter,
      this.pixSendDevolutionOperationCurrencyTag,
      this.pixSendDevolutionOperationTransactionTag,
      this.pixDevolutionZroBankIspb,
      this.pixDevolutionReceivedOperationTransactionTag,
    );

    try {
      // Call the devolution controller.
      const result = await controller.execute(payload);

      logger.info('PixDevolution updated.', { result });
    } catch (error) {
      const logError = error.data?.isAxiosError ? error.data.message : error;
      logger.error('Failed to add pixDevolution.', { error: logError });

      const errorMessage = await this.translateService.translateException(
        'default_exceptions',
        error,
      );
      const failed = new FailedEntity({
        code: error.code,
        message: errorMessage,
      });
      const value: HandleRevertPixDevolutionEventRequest = {
        ...message,
        failed,
      };

      await this.kafkaService.emit(KAFKA_EVENTS.PIX_DEVOLUTION.REVERTED, {
        ...ctx.getMessage(),
        value,
      });
    }
  }
}
