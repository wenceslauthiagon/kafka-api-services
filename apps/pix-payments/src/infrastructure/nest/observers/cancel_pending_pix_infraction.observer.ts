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
  TranslateService,
  KafkaService,
  FailedEntity,
} from '@zro/common';
import { PixInfractionRepository } from '@zro/pix-payments/domain';
import { PixInfractionGateway } from '@zro/pix-payments/application';
import {
  KAFKA_EVENTS,
  PixInfractionDatabaseRepository,
  PixInfractionEventKafkaEmitter,
} from '@zro/pix-payments/infrastructure';
import {
  HandleCancelPendingPixInfractionEventController,
  HandleCancelPendingPixInfractionEventRequest,
  HandleRevertPixInfractionEventRequest,
  PixInfractionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import {
  JdpiPixInfractionGatewayParam,
  JdpiPixInfractionInterceptor,
} from '@zro/jdpi';

export type HandleCancelPendingPixInfractionEventKafkaRequest =
  KafkaMessage<HandleCancelPendingPixInfractionEventRequest>;

/**
 * PixInfraction complete events observer.
 */
@Controller()
@ObserverController([JdpiPixInfractionInterceptor])
export class CancelPendingPixInfractionNestObserver {
  constructor(
    private kafkaService: KafkaService,
    private translateService: TranslateService,
  ) {}

  /**
   * Handler triggered when infraction is cancelled.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.PIX_INFRACTION.CANCEL_PENDING)
  async execute(
    @Payload('value') message: HandleCancelPendingPixInfractionEventRequest,
    @JdpiPixInfractionGatewayParam()
    pixInfractionGateway: PixInfractionGateway,
    @RepositoryParam(PixInfractionDatabaseRepository)
    infractionRepository: PixInfractionRepository,
    @EventEmitterParam(PixInfractionEventKafkaEmitter)
    infractionEventEmitter: PixInfractionEventEmitterControllerInterface,
    @LoggerParam(CancelPendingPixInfractionNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleCancelPendingPixInfractionEventRequest(message);

    logger.info('Handle pending cancel infraction.', { payload });

    const controller = new HandleCancelPendingPixInfractionEventController(
      logger,
      pixInfractionGateway,
      infractionRepository,
      infractionEventEmitter,
    );

    try {
      // Call open infraction handle.
      const result = await controller.execute(payload);

      logger.info('Infraction canceled.', { result });
    } catch (error) {
      const logError = error.data?.isAxiosError ? error.data.message : error;
      logger.error('Failed to cancel infraction.', { error: logError });

      const errorMessage = await this.translateService.translateException(
        'default_exceptions',
        error,
      );

      const failed = new FailedEntity({
        code: error.code,
        message: errorMessage,
      });
      const value: HandleRevertPixInfractionEventRequest = {
        ...message,
        failed,
      };

      await this.kafkaService.emit(KAFKA_EVENTS.PIX_INFRACTION.REVERTED, {
        ...ctx.getMessage(),
        value,
      });
    }
  }
}
