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
  SendPixDevolutionStateChangeNotificationRequest,
  SendPixDevolutionStateChangeNotificationController,
  BellNotificationEventEmitterControllerInterface,
} from '@zro/notifications/interface';

export type PixDevolutionEventKafkaRequest =
  KafkaMessage<SendPixDevolutionStateChangeNotificationRequest>;

/**
 * Pix Devolution complete events observer.
 */
@Controller()
@ObserverController()
export class PixDevolutionStateChangeNotificationNestObserver {
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
  @KafkaEventPattern(KAFKA_EVENTS.PIX_DEVOLUTION.CONFIRMED)
  async handleConfirmedPixDevolutionEvent(
    @Payload('value') message: SendPixDevolutionStateChangeNotificationRequest,
    @LoggerParam(PixDevolutionStateChangeNotificationNestObserver)
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

  @KafkaEventPattern(KAFKA_EVENTS.PIX_DEVOLUTION.FAILED)
  async handleFailedPixDevolutionEvent(
    @Payload('value') message: SendPixDevolutionStateChangeNotificationRequest,
    @LoggerParam(PixDevolutionStateChangeNotificationNestObserver)
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
    message: SendPixDevolutionStateChangeNotificationRequest,
    logger: Logger,
    bellNotificationRepository: BellNotificationRepository,
    bellNotificationEventEmitter: BellNotificationEventEmitterControllerInterface,
    userService: UserServiceKafka,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new SendPixDevolutionStateChangeNotificationRequest({
      notificationId: uuidV4(),
      id: message.id,
      state: message.state,
      amount: message.amount,
      userId: message.userId,
    });

    logger.info('Send pix devolution confirmed notification.', { payload });

    const controller = new SendPixDevolutionStateChangeNotificationController(
      logger,
      this.translateService,
      bellNotificationRepository,
      bellNotificationEventEmitter,
      userService,
    );

    try {
      // Call the pix Devolution controller.
      const bellNotification = await controller.execute(payload);

      logger.info('Pix devolution notification created.', {
        bellNotification,
      });
    } catch (error) {
      logger.error('Failed to create Pix devolution notification.', { error });

      // FIXME: Should notify IT team.
    }
  }
}
