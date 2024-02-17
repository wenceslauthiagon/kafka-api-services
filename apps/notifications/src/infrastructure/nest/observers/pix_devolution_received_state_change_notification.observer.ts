import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  RepositoryParam,
  ObserverController,
  KafkaServiceParam,
  TranslateService as NestTranslateService,
  EventEmitterParam,
} from '@zro/common';
import { BellNotificationRepository } from '@zro/notifications/domain';
import { KAFKA_EVENTS } from '@zro/pix-payments/infrastructure';
import {
  TranslateI18nService,
  BellNotificationDatabaseRepository,
  UserServiceKafka,
  BellNotificationEventKafkaEmitter,
} from '@zro/notifications/infrastructure';
import {
  ReceivePixDevolutionStateChangeNotificationRequest,
  ReceivePixDevolutionStateChangeNotificationController,
  BellNotificationEventEmitterControllerInterface,
} from '@zro/notifications/interface';

export type PixDevolutionReceivedEventKafkaRequest =
  KafkaMessage<ReceivePixDevolutionStateChangeNotificationRequest>;

/**
 * Pix Devolution Received complete events observer.
 */
@Controller()
@ObserverController()
export class PixDevolutionReceivedStateChangeNotificationNestObserver {
  private translateService: TranslateI18nService;

  constructor(translateService: NestTranslateService) {
    this.translateService = new TranslateI18nService(translateService);
  }

  /**
   * Consumer of create bell notification.
   * @param bellNotificationRepository Bell notification repository.
   * @param bellNotificationEventEmitter Bell notification event emitter.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.PIX_DEVOLUTION_RECEIVED.READY)
  async handleReceivePixDevolutionReadyEvent(
    @Payload('value')
    message: ReceivePixDevolutionStateChangeNotificationRequest,
    @LoggerParam(PixDevolutionReceivedStateChangeNotificationNestObserver)
    logger: Logger,
    @RepositoryParam(BellNotificationDatabaseRepository)
    bellNotificationRepository: BellNotificationRepository,
    @EventEmitterParam(BellNotificationEventKafkaEmitter)
    bellNotificationEventEmitter: BellNotificationEventEmitterControllerInterface,
    @KafkaServiceParam(UserServiceKafka)
    userService: UserServiceKafka,
  ): Promise<void> {
    return this.handle(
      message,
      logger,
      bellNotificationRepository,
      bellNotificationEventEmitter,
      userService,
    );
  }

  private async handle(
    message: ReceivePixDevolutionStateChangeNotificationRequest,
    logger: Logger,
    bellNotificationRepository: BellNotificationRepository,
    bellNotificationEventEmitter: BellNotificationEventEmitterControllerInterface,
    userService: UserServiceKafka,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new ReceivePixDevolutionStateChangeNotificationRequest({
      id: message.id,
      state: message.state,
      userId: message.userId,
      amount: message.amount,
      notificationId: uuidV4(),
    });

    logger.info('Send pix devolution received notification.', {
      payload,
    });

    const controller =
      new ReceivePixDevolutionStateChangeNotificationController(
        logger,
        this.translateService,
        bellNotificationRepository,
        bellNotificationEventEmitter,
        userService,
      );

    try {
      // Call the pix Devolution Received controller.
      const bellNotification = await controller.execute(payload);

      logger.info('Confirmed pix devolution received notification.', {
        bellNotification,
      });
    } catch (error) {
      logger.error(
        'Failed to send confirmed pix devolution received notification.',
        error,
      );

      // FIXME: Should notify IT team.
    }
  }
}
