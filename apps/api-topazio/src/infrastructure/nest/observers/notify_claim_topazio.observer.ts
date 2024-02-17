import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  ObserverController,
  KafkaServiceParam,
  RepositoryParam,
  KafkaService,
  EventEmitterParam,
} from '@zro/common';
import { NotifyClaimRepository } from '@zro/api-topazio/domain';
import {
  KAFKA_EVENTS,
  KAFKA_HUB,
  PixKeyServiceKafka,
  NotifyClaimDatabaseRepository,
  NotifyClaimEventKafkaEmitter,
} from '@zro/api-topazio/infrastructure';
import {
  HandleNotifyClaimTopazioEventController,
  HandleNotifyClaimTopazioEventRequest,
  HandleFailedNotifyClaimTopazioEventController,
  NotifyClaimEventEmitterControllerInterface,
} from '@zro/api-topazio/interface';

export type HandleNotifyClaimTopazioEventKafkaRequest =
  KafkaMessage<HandleNotifyClaimTopazioEventRequest>;

/**
 * Notify claim topazio observer.
 */
@Controller()
@ObserverController()
export class NotifyClaimTopazioNestObserver {
  constructor(private kafkaService: KafkaService) {
    this.kafkaService.createEvents([
      KAFKA_HUB.NOTIFY_CLAIM.PIX_GATEWAY,
      KAFKA_HUB.NOTIFY_CLAIM.DEAD_LETTER,
    ]);
  }

  /**
   * Handler triggered when notify claim.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.TOPAZIO.NOTIFY_CLAIMS)
  async handleNotifyClaimTopazioEvent(
    @Payload('value') message: HandleNotifyClaimTopazioEventKafkaRequest,
    @LoggerParam(NotifyClaimTopazioNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received notify claim event.', { value: message });

    // Select pix gateway to send claim.
    await this.kafkaService.emit(
      KAFKA_HUB.NOTIFY_CLAIM.PIX_GATEWAY,
      ctx.getMessage(),
    );
  }

  /**
   * Handler triggered when notify claim.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.NOTIFY_CLAIM.PIX_GATEWAY)
  async handleNotifyClaimTopazioEventViaPixKey(
    @Payload('value') message: HandleNotifyClaimTopazioEventRequest,
    @LoggerParam(NotifyClaimTopazioNestObserver)
    logger: Logger,
    @KafkaServiceParam(PixKeyServiceKafka)
    pixKeyService: PixKeyServiceKafka,
    @RepositoryParam(NotifyClaimDatabaseRepository)
    notifyClaimRepository: NotifyClaimRepository,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleNotifyClaimTopazioEventRequest(message);

    logger.debug('Handle create claim event.', { payload });

    const controller = new HandleNotifyClaimTopazioEventController(
      logger,
      pixKeyService,
      notifyClaimRepository,
    );

    try {
      // Call the pix controller.
      await controller.execute(payload);

      logger.debug('Success to Notify claim process.');
    } catch (error) {
      logger.error('Failed to notify claim process.', { error });

      // TODO: Enviar mensagem para a fila de retry
      // Isso aqui é temporário e deverá ser substituido o mais breve possível
      await this.kafkaService.emit(
        KAFKA_HUB.NOTIFY_CLAIM.DEAD_LETTER,
        ctx.getMessage(),
      );

      throw error;
    }
  }

  /**
   * Handle Topazio dead letter event. Notify claim here have all retries failed.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.NOTIFY_CLAIM.DEAD_LETTER)
  async handleNotifyClaimTopazioDeadLetterEvent(
    @Payload('value') message: HandleNotifyClaimTopazioEventRequest,
    @LoggerParam(NotifyClaimTopazioNestObserver)
    logger: Logger,
    @RepositoryParam(NotifyClaimDatabaseRepository)
    notifyClaimRepository: NotifyClaimRepository,
    @EventEmitterParam(NotifyClaimEventKafkaEmitter)
    eventEmitter: NotifyClaimEventEmitterControllerInterface,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleNotifyClaimTopazioEventRequest(message);

    logger.debug('Handle failed claim event.', { payload });

    const controller = new HandleFailedNotifyClaimTopazioEventController(
      logger,
      notifyClaimRepository,
      eventEmitter,
    );

    try {
      // Call the notify controller.
      await controller.execute(payload);

      logger.debug('Success to save fail notify.');
    } catch (error) {
      logger.error('Failed to save a fail notify.', { error });
    }
  }
}
