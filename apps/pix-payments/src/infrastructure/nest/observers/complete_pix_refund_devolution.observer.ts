import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Ctx, KafkaContext, Payload } from '@nestjs/microservices';
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
  PixInfractionRefundOperationRepository,
  PixRefundDevolutionRepository,
  PixRefundRepository,
} from '@zro/pix-payments/domain';
import { PixRefundGateway } from '@zro/pix-payments/application';
import {
  PixRefundDevolutionDatabaseRepository,
  PixRefundDevolutionEventKafkaEmitter,
  KAFKA_EVENTS,
  OperationServiceKafka,
  PixRefundDatabaseRepository,
  PixRefundEventKafkaEmitter,
  PixInfractionRefundOperationDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import {
  HandleCompletePixRefundDevolutionEventController,
  PixRefundDevolutionEventEmitterControllerInterface,
  HandleCompletePixRefundDevolutionEventRequest,
  PixRefundEventEmitterControllerInterface,
  HandleRevertPixRefundDevolutionEventRequest,
} from '@zro/pix-payments/interface';
import { JdpiPixRefundGatewayParam, JdpiPixRefundInterceptor } from '@zro/jdpi';

export type HandleCompletePixRefundDevolutionEventKafkaRequest =
  KafkaMessage<HandleCompletePixRefundDevolutionEventRequest>;

/**
 * PixRefundDevolution complete events observer.
 */
@Controller()
@ObserverController([JdpiPixRefundInterceptor])
export class CompletePixRefundDevolutionNestObserver {
  constructor(
    private kafkaService: KafkaService,
    private translateService: TranslateService,
  ) {}

  /**
   * Handler triggered when devolution is complete.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.PIX_REFUND_DEVOLUTION.COMPLETED)
  async execute(
    @Payload('value') message: HandleCompletePixRefundDevolutionEventRequest,
    @RepositoryParam(PixRefundDevolutionDatabaseRepository)
    refundDevolutionRepository: PixRefundDevolutionRepository,
    @RepositoryParam(PixRefundDatabaseRepository)
    refundRepository: PixRefundRepository,
    @RepositoryParam(PixInfractionRefundOperationDatabaseRepository)
    pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository,
    @EventEmitterParam(PixRefundDevolutionEventKafkaEmitter)
    serviceRefundDevolutionEventEmitter: PixRefundDevolutionEventEmitterControllerInterface,
    @EventEmitterParam(PixRefundEventKafkaEmitter)
    serviceRefundEventEmitter: PixRefundEventEmitterControllerInterface,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @LoggerParam(CompletePixRefundDevolutionNestObserver)
    logger: Logger,
    @JdpiPixRefundGatewayParam()
    pixRefundGateway: PixRefundGateway,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleCompletePixRefundDevolutionEventRequest(message);

    logger.info('Handle added event complete devolution.', { payload });

    const controller = new HandleCompletePixRefundDevolutionEventController(
      logger,
      refundDevolutionRepository,
      refundRepository,
      pixInfractionRefundOperationRepository,
      operationService,
      pixRefundGateway,
      serviceRefundEventEmitter,
      serviceRefundDevolutionEventEmitter,
    );

    try {
      // Call the devolution controller.
      const result = await controller.execute(payload);

      logger.info('Refund devolution completed.', { result });
    } catch (error) {
      const logError = error.data?.isAxiosError ? error.data.message : error;
      logger.error('Failed to complete pixRefundDevolution.', {
        error: logError,
      });

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
