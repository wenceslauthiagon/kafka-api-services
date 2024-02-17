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
  PixDepositRepository,
  PixDevolutionReceivedRepository,
  PixRefundDevolutionRepository,
} from '@zro/pix-payments/domain';
import { PixPaymentGateway } from '@zro/pix-payments/application';
import {
  PixRefundDevolutionDatabaseRepository,
  PixDepositDatabaseRepository,
  PixRefundDevolutionEventKafkaEmitter,
  KAFKA_EVENTS,
  KAFKA_HUB,
  OperationServiceKafka,
  PixDevolutionReceivedDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import {
  HandlePendingPixRefundDevolutionEventController,
  PixRefundDevolutionEventEmitterControllerInterface,
  HandlePendingPixRefundDevolutionEventRequest,
  HandleRevertPixRefundDevolutionEventRequest,
} from '@zro/pix-payments/interface';

export type HandlePendingPixRefundDevolutionEventKafkaRequest =
  KafkaMessage<HandlePendingPixRefundDevolutionEventRequest>;

interface PixRefundDevolutionOperationConfig {
  APP_OPERATION_CURRENCY_TAG: string;
  APP_OPERATION_SEND_PIX_REFUND_DEVOLUTION_TRANSACTION_TAG: string;
  APP_ZROBANK_ISPB: string;
  APP_OPERATION_PIX_DEVOLUTION_RECEIVED_TRANSACTION_TAG: string;
}

/**
 * PixDevolution pending events observer.
 */
@Controller()
@ObserverController([JdpiPixPaymentInterceptor])
export class PendingPixRefundDevolutionNestObserver {
  private pixSendRefundDevolutionOperationCurrencyTag: string;
  private pixSendRefundDevolutionOperationTransactionTag: string;
  private pixDevolutionZroBankIspb: string;

  constructor(
    private kafkaService: KafkaService,
    private configService: ConfigService<PixRefundDevolutionOperationConfig>,
    private translateService: TranslateService,
  ) {
    this.pixSendRefundDevolutionOperationCurrencyTag =
      this.configService.get<string>('APP_OPERATION_CURRENCY_TAG');
    this.pixSendRefundDevolutionOperationTransactionTag =
      this.configService.get<string>(
        'APP_OPERATION_SEND_PIX_REFUND_DEVOLUTION_TRANSACTION_TAG',
      );
    this.pixDevolutionZroBankIspb =
      this.configService.get<string>('APP_ZROBANK_ISPB');
    this.kafkaService.createEvents([
      KAFKA_HUB.PIX_REFUND_DEVOLUTION.PENDING.TOPAZIO_GATEWAY,
    ]);
  }

  /**
   * Handler triggered when devolution is pending.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.PIX_REFUND_DEVOLUTION.PENDING)
  async handlePendingPixRefundDevolutionEvent(
    @Payload('value') message: HandlePendingPixRefundDevolutionEventRequest,
    @LoggerParam(PendingPixRefundDevolutionNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.info('Received added pixDevolution event.', { value: message });

    // Select topazio gateway to add PixDevolution.
    await this.kafkaService.emit(
      KAFKA_HUB.PIX_REFUND_DEVOLUTION.PENDING.TOPAZIO_GATEWAY,
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
  @KafkaEventPattern(KAFKA_HUB.PIX_REFUND_DEVOLUTION.PENDING.TOPAZIO_GATEWAY)
  async handlePendingPixRefundDevolutionEventViaTopazio(
    @Payload('value') message: HandlePendingPixRefundDevolutionEventRequest,
    @RepositoryParam(PixRefundDevolutionDatabaseRepository)
    pixRefundDevolutionRepository: PixRefundDevolutionRepository,
    @RepositoryParam(PixDepositDatabaseRepository)
    depositRepository: PixDepositRepository,
    @EventEmitterParam(PixRefundDevolutionEventKafkaEmitter)
    serviceEventEmitter: PixRefundDevolutionEventEmitterControllerInterface,
    @JdpiPixPaymentGatewayParam()
    pspGateway: PixPaymentGateway,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @RepositoryParam(PixDevolutionReceivedDatabaseRepository)
    devolutionReceivedRepository: PixDevolutionReceivedRepository,
    @LoggerParam(PendingPixRefundDevolutionNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandlePendingPixRefundDevolutionEventRequest(message);

    logger.info('Handle added event pending pixDevolution.', { payload });

    const controller = new HandlePendingPixRefundDevolutionEventController(
      logger,
      pixRefundDevolutionRepository,
      depositRepository,
      serviceEventEmitter,
      pspGateway,
      operationService,
      devolutionReceivedRepository,
      this.pixSendRefundDevolutionOperationCurrencyTag,
      this.pixSendRefundDevolutionOperationTransactionTag,
      this.pixDevolutionZroBankIspb,
    );

    try {
      // Call the devolution controller.
      const result = await controller.execute(payload);

      logger.info('PixRefundDevolution updated.', { result });
    } catch (error) {
      const logError = error.data?.isAxiosError ? error.data.message : error;
      logger.error('Failed to add pixRefundDevolution.', { error: logError });

      const errorMessage = await this.translateService.translateException(
        'default_exceptions',
        error,
      );
      const failed = new FailedEntity({
        code: error.code,
        message: errorMessage,
      });
      const value: HandleRevertPixRefundDevolutionEventRequest = {
        ...message,
        failed,
      };

      await this.kafkaService.emit(
        KAFKA_EVENTS.PIX_REFUND_DEVOLUTION.REVERTED,
        { ...ctx.getMessage(), value },
      );
    }
  }
}
