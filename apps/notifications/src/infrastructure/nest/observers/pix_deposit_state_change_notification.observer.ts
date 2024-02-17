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
  SendPixDepositStateChangeNotificationRequest,
  SendPixDepositStateChangeNotificationController,
  BellNotificationEventEmitterControllerInterface,
} from '@zro/notifications/interface';

export type PixDepositEventKafkaRequest =
  KafkaMessage<SendPixDepositStateChangeNotificationRequest>;

/**
 * Pix Deposit notification events observer.
 */
@Controller()
@ObserverController()
export class PixDepositStateChangeNotificationNestObserver {
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
  @KafkaEventPattern(KAFKA_EVENTS.PIX_DEPOSIT.RECEIVED)
  async handleReceivedPixDepositEvent(
    @Payload('value') message: SendPixDepositStateChangeNotificationRequest,
    @LoggerParam(PixDepositStateChangeNotificationNestObserver)
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

  @KafkaEventPattern(KAFKA_EVENTS.PIX_DEPOSIT.ERROR)
  async handleErrorPixDepositEvent(
    @Payload('value') message: SendPixDepositStateChangeNotificationRequest,
    @LoggerParam(PixDepositStateChangeNotificationNestObserver)
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

  @KafkaEventPattern(KAFKA_EVENTS.PIX_DEPOSIT.BLOCKED)
  async handleBlockedPixDepositEvent(
    @Payload('value') message: SendPixDepositStateChangeNotificationRequest,
    @LoggerParam(PixDepositStateChangeNotificationNestObserver)
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
    message: SendPixDepositStateChangeNotificationRequest,
    logger: Logger,
    bellNotificationRepository: BellNotificationRepository,
    bellNotificationEventEmitter: BellNotificationEventEmitterControllerInterface,
    userService: UserServiceKafka,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new SendPixDepositStateChangeNotificationRequest({
      notificationId: uuidV4(),
      id: message.id,
      state: message.state,
      userId: message.userId,
      amount: message.amount,
      thirdPartName: message.thirdPartName,
    });

    logger.info('Send pix deposit confirmed notification.', { payload });

    const controller = new SendPixDepositStateChangeNotificationController(
      logger,
      this.translateService,
      bellNotificationRepository,
      bellNotificationEventEmitter,
      userService,
    );

    try {
      // Call the pix deposit controller.
      const bellNotification = await controller.execute(payload);

      logger.info('Pix deposit notification created.', { bellNotification });
    } catch (error) {
      logger.error('Failed to create pix deposit notification.', {
        error,
      });

      // FIXME: Should notify IT team.
    }
  }
}
