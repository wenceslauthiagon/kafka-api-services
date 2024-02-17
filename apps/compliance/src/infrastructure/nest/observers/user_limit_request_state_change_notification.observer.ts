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
  RequestId,
  TranslateService as NestTranslateService,
} from '@zro/common';
import { UserLimitRequestRepository } from '@zro/compliance/domain';
import {
  UserLimitRequestDatabaseRepository,
  KAFKA_EVENTS,
  TranslateI18nService,
  NotificationServiceKafka,
} from '@zro/compliance/infrastructure';
import {
  SendUserLimitRequestStateChangeNotificationRequest,
  SendUserLimitRequestStateChangeNotificationController,
} from '@zro/compliance/interface';

export type UserLimitRequestEventKafkaRequest =
  KafkaMessage<SendUserLimitRequestStateChangeNotificationRequest>;

/**
 * UserLimitRequest notification events observer.
 */
@Controller()
@ObserverController()
export class UserLimitRequestStateChangeNotificationNestObserver {
  private translateService: TranslateI18nService;

  constructor(translateService: NestTranslateService) {
    this.translateService = new TranslateI18nService(translateService);
  }

  @KafkaEventPattern(KAFKA_EVENTS.USER_LIMIT_REQUEST.CLOSED_CONFIRMED_APPROVED)
  async handleClosedConfirmedApprovedUserLimitRequestEvent(
    @Payload('value')
    message: SendUserLimitRequestStateChangeNotificationRequest,
    @RepositoryParam(UserLimitRequestDatabaseRepository)
    paymentRepository: UserLimitRequestRepository,
    @KafkaServiceParam(NotificationServiceKafka)
    notificationService: NotificationServiceKafka,
    @LoggerParam(UserLimitRequestStateChangeNotificationNestObserver)
    logger: Logger,
    @RequestId() requestId: string,
  ): Promise<void> {
    return this.handle(
      message,
      paymentRepository,
      notificationService,
      logger,
      requestId,
    );
  }

  @KafkaEventPattern(KAFKA_EVENTS.USER_LIMIT_REQUEST.CLOSED_CONFIRMED_REJECTED)
  async handleClosedConfirmedRejectedUserLimitRequestEvent(
    @Payload('value')
    message: SendUserLimitRequestStateChangeNotificationRequest,
    @RepositoryParam(UserLimitRequestDatabaseRepository)
    paymentRepository: UserLimitRequestRepository,
    @KafkaServiceParam(NotificationServiceKafka)
    notificationService: NotificationServiceKafka,
    @LoggerParam(UserLimitRequestStateChangeNotificationNestObserver)
    logger: Logger,
    @RequestId() requestId: string,
  ): Promise<void> {
    return this.handle(
      message,
      paymentRepository,
      notificationService,
      logger,
      requestId,
    );
  }

  private async handle(
    message: SendUserLimitRequestStateChangeNotificationRequest,
    userLimitRequestRepository: UserLimitRequestRepository,
    notificationService: NotificationServiceKafka,
    logger: Logger,
    requestId: string,
  ): Promise<void> {
    logger.debug('Received message.', { requestId, value: message });

    // Parse kafka message.
    const payload = new SendUserLimitRequestStateChangeNotificationRequest({
      ...message,
      notificationId: requestId,
    });

    logger.info('Send user limit request confirmed notification.', { payload });

    const controller =
      new SendUserLimitRequestStateChangeNotificationController(
        logger,
        userLimitRequestRepository,
        notificationService,
        this.translateService,
      );

    try {
      // Call the user limit request controller.
      const result = await controller.execute(payload);

      logger.info('Confirmed user limit request notification.', { result });
    } catch (error) {
      logger.error(
        'Failed to send confirmed user limit request notification.',
        error,
      );

      // FIXME: Should notify IT team.
    }
  }
}
