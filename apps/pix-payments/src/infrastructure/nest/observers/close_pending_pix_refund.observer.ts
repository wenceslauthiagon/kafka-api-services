import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  RepositoryParam,
  ObserverController,
  EventEmitterParam,
  KafkaService,
  TranslateService,
  FailedEntity,
} from '@zro/common';
import { PixRefundRepository } from '@zro/pix-payments/domain';
import {
  KAFKA_EVENTS,
  PixRefundDatabaseRepository,
  PixRefundEventKafkaEmitter,
  PixRefundDevolutionEventKafkaEmitter,
} from '@zro/pix-payments/infrastructure';
import {
  HandleClosePendingPixRefundEventController,
  HandleClosePendingPixRefundEventRequest,
  HandleRevertPixRefundEventRequest,
  PixRefundDevolutionEventEmitterControllerInterface,
  PixRefundEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type HandleClosePendingPixRefundEventKafkaRequest =
  KafkaMessage<HandleClosePendingPixRefundEventRequest>;

/**
 * Pix receive pending pixRefund events observer.
 */
@Controller()
@ObserverController()
export class ClosePendingPixRefundNestObserver {
  constructor(
    private kafkaService: KafkaService,
    private translateService: TranslateService,
  ) {}
  /**
   * Handler triggered when close pix refund is pending.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.PIX_REFUND.CLOSED_PENDING)
  async execute(
    @Payload('value') message: HandleClosePendingPixRefundEventRequest,
    @RepositoryParam(PixRefundDatabaseRepository)
    refundRepository: PixRefundRepository,
    @EventEmitterParam(PixRefundEventKafkaEmitter)
    pixRefundEventEmitter: PixRefundEventEmitterControllerInterface,
    @EventEmitterParam(PixRefundDevolutionEventKafkaEmitter)
    pixRefundDevolutionEventEmitter: PixRefundDevolutionEventEmitterControllerInterface,
    @LoggerParam(ClosePendingPixRefundNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleClosePendingPixRefundEventRequest(message);

    logger.info('Handle received pix refund pending event.', { payload });

    const controller = new HandleClosePendingPixRefundEventController(
      logger,
      refundRepository,
      pixRefundEventEmitter,
      pixRefundDevolutionEventEmitter,
    );

    try {
      // Call receive pix refund handler.
      const result = await controller.execute(payload);

      logger.info('PixRefund received.', { result });
    } catch (error) {
      const logError = error.data?.isAxiosError ? error.data.message : error;
      logger.error('Failed to close infraction.', { error: logError });

      const errorMessage = await this.translateService.translateException(
        'default_exceptions',
        error,
      );

      const failed = new FailedEntity({
        code: error.code,
        message: errorMessage,
      });
      const value: HandleRevertPixRefundEventRequest = {
        ...message,
        failed,
      };

      await this.kafkaService.emit(KAFKA_EVENTS.PIX_REFUND.REVERTED, {
        ...ctx.getMessage(),
        value,
      });
    }
  }
}
