import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  ObserverController,
  KafkaServiceParam,
  TranslateService as NestTranslateService,
  RepositoryParam,
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
  SendPaymentStateChangeNotificationRequest,
  SendPaymentStateChangeNotificationController,
  BellNotificationEventEmitterControllerInterface,
} from '@zro/notifications/interface';

export type PaymentEventKafkaRequest =
  KafkaMessage<SendPaymentStateChangeNotificationRequest>;

/**
 * Payment notification events observer.
 */
@Controller()
@ObserverController()
export class PaymentStateChangeNotificationNestObserver {
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
  @KafkaEventPattern(KAFKA_EVENTS.PAYMENT.CONFIRMED)
  async handleConfirmedPaymentEvent(
    @Payload('value') message: SendPaymentStateChangeNotificationRequest,
    @LoggerParam(PaymentStateChangeNotificationNestObserver)
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

  @KafkaEventPattern(KAFKA_EVENTS.PAYMENT.CANCELED)
  async handleCanceledPaymentEvent(
    @Payload('value') message: SendPaymentStateChangeNotificationRequest,
    @LoggerParam(PaymentStateChangeNotificationNestObserver)
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

  @KafkaEventPattern(KAFKA_EVENTS.PAYMENT.ERROR)
  async handleErrorPaymentEvent(
    @Payload('value') message: SendPaymentStateChangeNotificationRequest,
    @LoggerParam(PaymentStateChangeNotificationNestObserver)
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

  @KafkaEventPattern(KAFKA_EVENTS.PAYMENT.SCHEDULED)
  async handleScheduledPaymentEvent(
    @Payload('value') message: SendPaymentStateChangeNotificationRequest,
    @LoggerParam(PaymentStateChangeNotificationNestObserver)
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

  @KafkaEventPattern(KAFKA_EVENTS.PAYMENT.FAILED)
  async handleFailedPaymentEvent(
    @Payload('value') message: SendPaymentStateChangeNotificationRequest,
    @LoggerParam(PaymentStateChangeNotificationNestObserver)
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
    message: SendPaymentStateChangeNotificationRequest,
    logger: Logger,
    bellNotificationRepository: BellNotificationRepository,
    bellNotificationEventEmitter: BellNotificationEventEmitterControllerInterface,
    userService: UserServiceKafka,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new SendPaymentStateChangeNotificationRequest({
      id: message.id,
      state: message.state,
      userId: message.userId,
      beneficiaryName: message.beneficiaryName,
      value: message.value,
      notificationId: uuidV4(),
    });

    logger.info('Send payment confirmed notification.', { payload });

    const controller = new SendPaymentStateChangeNotificationController(
      logger,
      this.translateService,
      bellNotificationRepository,
      bellNotificationEventEmitter,
      userService,
    );

    try {
      // Call the payment controller.
      const bellNotification = await controller.execute(payload);

      logger.info('Payment notification created.', { bellNotification });
    } catch (error) {
      logger.error('Failed to to create payment notification.', { error });

      // FIXME: Should notify IT team.
    }
  }
}
