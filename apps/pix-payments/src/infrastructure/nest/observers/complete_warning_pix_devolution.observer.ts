import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  EventEmitterParam,
  LoggerParam,
  RepositoryParam,
  ObserverController,
  KafkaService,
  TranslateService,
  FailedEntity,
} from '@zro/common';
import { WarningPixDevolutionRepository } from '@zro/pix-payments/domain';
import {
  WarningPixDevolutionDatabaseRepository,
  WarningPixDevolutionEventKafkaEmitter,
  KAFKA_EVENTS,
} from '@zro/pix-payments/infrastructure';
import {
  HandleCompleteWarningPixDevolutionEventController,
  HandleCompleteWarningPixDevolutionEventRequest,
  HandleRevertWarningPixDevolutionEventRequest,
  WarningPixDevolutionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type HandleCompleteWarningPixDevolutionEventKafkaRequest =
  KafkaMessage<HandleCompleteWarningPixDevolutionEventRequest>;

/**
 * PixDevolution complete events observer.
 */
@Controller()
@ObserverController()
export class CompleteWarningPixDevolutionNestObserver {
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
  @KafkaEventPattern(KAFKA_EVENTS.WARNING_PIX_DEVOLUTION.COMPLETED)
  async execute(
    @Payload('value') message: HandleCompleteWarningPixDevolutionEventRequest,
    @RepositoryParam(WarningPixDevolutionDatabaseRepository)
    warningPixDevolutionRepository: WarningPixDevolutionRepository,
    @EventEmitterParam(WarningPixDevolutionEventKafkaEmitter)
    serviceWarningPixDevolutionEventEmitter: WarningPixDevolutionEventEmitterControllerInterface,
    @LoggerParam(CompleteWarningPixDevolutionNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleCompleteWarningPixDevolutionEventRequest(message);

    logger.info('Handle added event complete devolution.', { payload });

    const controller = new HandleCompleteWarningPixDevolutionEventController(
      logger,
      warningPixDevolutionRepository,
      serviceWarningPixDevolutionEventEmitter,
    );

    try {
      // Call the warnign pix devolution controller.
      const result = await controller.execute(payload);

      logger.info('Warning pix devolution completed.', { result });
    } catch (error) {
      const logError = error.data?.isAxiosError ? error.data.message : error;

      logger.error('Failed to complete warning pix devolution.', {
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
      const value: HandleRevertWarningPixDevolutionEventRequest = {
        ...message,
        failed,
      };

      await this.kafkaService.emit(
        KAFKA_EVENTS.WARNING_PIX_DEVOLUTION.REVERTED,
        { ...ctx.getMessage(), value },
      );
    }
  }
}
