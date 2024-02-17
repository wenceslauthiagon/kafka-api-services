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
  FailedEntity,
  KafkaService,
  TranslateService,
} from '@zro/common';
import { PixRefundRepository } from '@zro/pix-payments/domain';
import { PixRefundGateway } from '@zro/pix-payments/application';
import {
  KAFKA_EVENTS,
  PixRefundDatabaseRepository,
  PixRefundEventKafkaEmitter,
} from '@zro/pix-payments/infrastructure';
import {
  HandleCancelPendingPixRefundEventController,
  HandleCancelPendingPixRefundEventRequest,
  HandleRevertPixRefundEventRequest,
  PixRefundEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import { JdpiPixRefundGatewayParam, JdpiPixRefundInterceptor } from '@zro/jdpi';

export type HandleCancelPendingPixRefundEventKafkaRequest =
  KafkaMessage<HandleCancelPendingPixRefundEventRequest>;

/**
 * PixRefund cancel events observer.
 */
@Controller()
@ObserverController([JdpiPixRefundInterceptor])
export class CancelPendingPixRefundNestObserver {
  constructor(
    private kafkaService: KafkaService,
    private translateService: TranslateService,
  ) {}
  /**
   * Handler triggered when pixRefund is complete.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.PIX_REFUND.CANCEL_PENDING)
  async execute(
    @Payload('value') message: HandleCancelPendingPixRefundEventRequest,
    @RepositoryParam(PixRefundDatabaseRepository)
    pixRefundRepository: PixRefundRepository,
    @JdpiPixRefundGatewayParam()
    pixRefundGateway: PixRefundGateway,
    @EventEmitterParam(PixRefundEventKafkaEmitter)
    pixRefundEventEmitter: PixRefundEventEmitterControllerInterface,
    @LoggerParam(CancelPendingPixRefundNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleCancelPendingPixRefundEventRequest(message);

    logger.info('Handle cancel pending pixRefund.', { payload });

    const controller = new HandleCancelPendingPixRefundEventController(
      logger,
      pixRefundRepository,
      pixRefundGateway,
      pixRefundEventEmitter,
    );

    try {
      // Call open pix refund handle.
      const result = await controller.execute(payload);

      logger.info('PixRefund canceled.', { result });
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
