import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import {
  EventEmitterParam,
  KafkaMessage,
  KafkaEventPattern,
  KafkaServiceParam,
  LoggerParam,
  ObserverController,
  RepositoryParam,
  TranslateService as NestTranslateService,
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
  SendWarningPixDepositStateChangeNotificationRequest,
  SendWarningPixDepositStateChangeNotificationController,
  BellNotificationEventEmitterControllerInterface,
} from '@zro/notifications/interface';

export type WarningPixDepositEventKafkaRequest =
  KafkaMessage<SendWarningPixDepositStateChangeNotificationRequest>;

/**
 * Warning Pix Deposit notification events observer.
 */
@Controller()
@ObserverController()
export class WarningPixDepositStateChangeNotificationNestObserver {
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
  @KafkaEventPattern(KAFKA_EVENTS.WARNING_PIX_DEPOSIT.CREATED)
  async handleCreatedWarningPixDepositEvent(
    @Payload('value')
    message: SendWarningPixDepositStateChangeNotificationRequest,
    @LoggerParam(WarningPixDepositStateChangeNotificationNestObserver)
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
    message: SendWarningPixDepositStateChangeNotificationRequest,
    logger: Logger,
    bellNotificationRepository: BellNotificationRepository,
    bellNotificationEventEmitter: BellNotificationEventEmitterControllerInterface,
    userService: UserServiceKafka,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new SendWarningPixDepositStateChangeNotificationRequest({
      ...message,
      notificationId: uuidV4(),
    });

    logger.info('Send warning pix deposit notification.', { payload });

    const controller =
      new SendWarningPixDepositStateChangeNotificationController(
        logger,
        this.translateService,
        bellNotificationRepository,
        bellNotificationEventEmitter,
        userService,
      );

    try {
      // Call warning pix deposit controller.
      const bellNotification = await controller.execute(payload);

      logger.info('Warning pix deposit notification created.', {
        bellNotification,
      });
    } catch (error) {
      logger.error('Failed to create warning pix deposit notification.', {
        error,
      });

      // FIXME: Should notify IT team.
    }
  }
}
