import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { Logger } from 'winston';
import {
  EventEmitterParam,
  KafkaMessage,
  KafkaEventPattern,
  KafkaService,
  LoggerParam,
  KafkaServiceParam,
  ObserverController,
  RepositoryParam,
} from '@zro/common';
import { BellNotificationRepository } from '@zro/notifications/domain';
import {
  UserService,
  PushNotificationGateway,
} from '@zro/notifications/application';
import {
  BellNotificationDatabaseRepository,
  BellNotificationEventKafkaEmitter,
  UserServiceKafka,
  KAFKA_EVENTS,
  KAFKA_HUB,
} from '@zro/notifications/infrastructure';
import {
  BellNotificationEventEmitterControllerInterface,
  HandleBellNotificationCreatedController,
  HandleBellNotificationCreatedEventRequest,
  THandleBellNotificationCreatedEventRequest,
} from '@zro/notifications/interface';
import { FcmDecorator, FcmInterceptor } from '@zro/fcm';

export type HandleBellNotificationCreatedEventKafka =
  KafkaMessage<THandleBellNotificationCreatedEventRequest>;

/**
 * Bell notification events observer.
 */
@Controller()
@ObserverController([FcmInterceptor])
export class BellNotificationNestObserver {
  /**
   * Default bell notification RPC controller constructor.
   * @param kafkaService
   */
  constructor(private kafkaService: KafkaService) {
    this.kafkaService.createEvents([KAFKA_HUB.BELL_NOTIFICATION.FCM_GATEWAY]);
  }

  /**
   * Handle bell notification created event and send it to gateway hub selector.
   * @param message Event Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.BELL_NOTIFICATION.CREATED)
  async handleBellNotificationCreatedEvent(
    @Payload('value') message: HandleBellNotificationCreatedEventRequest,
    @LoggerParam(BellNotificationNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ) {
    logger.debug('Received bell notification created event', {
      value: message,
    });

    // Select FCM gateway to send a push notification.
    await this.kafkaService.emit(
      KAFKA_HUB.BELL_NOTIFICATION.FCM_GATEWAY,
      ctx.getMessage(),
    );
  }

  /**
   * Handle bell nofification event and send it via FCM.
   * @param message Event Kafka message.
   * @param bellNotificationRepository bell notification repository.
   * @param bellNotificationEventEmitter bell notification event emitter.
   * @param logger Local logger instance.
   * @param fcmGateway Bell notification gateway.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.BELL_NOTIFICATION.FCM_GATEWAY)
  async handleBellNotificationCreatedEventViaFcm(
    @Payload('value') message: HandleBellNotificationCreatedEventRequest,
    @RepositoryParam(BellNotificationDatabaseRepository)
    bellNotificationRepository: BellNotificationRepository,
    @KafkaServiceParam(UserServiceKafka)
    userService: UserService,
    @EventEmitterParam(BellNotificationEventKafkaEmitter)
    bellNotificationEventEmitter: BellNotificationEventEmitterControllerInterface,
    @LoggerParam(BellNotificationNestObserver)
    logger: Logger,
    @FcmDecorator() fcmGateway: PushNotificationGateway,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleBellNotificationCreatedEventRequest(message);

    logger.debug('Sending push notification via FCM.', { payload });

    try {
      const controller = new HandleBellNotificationCreatedController(
        bellNotificationRepository,
        bellNotificationEventEmitter,
        userService,
        fcmGateway,
        logger,
      );
      // Send push bell notification
      await controller.execute(payload);
    } catch (error) {
      logger.error('Failed to send bell notification', { error });
    }
  }
}
