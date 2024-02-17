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
import { UserWithdrawSettingRequestRepository } from '@zro/compliance/domain';
import {
  UserWithdrawSettingRequestDatabaseRepository,
  KAFKA_EVENTS,
  TranslateI18nService,
  NotificationServiceKafka,
} from '@zro/compliance/infrastructure';
import {
  SendUserWithdrawSettingRequestStateChangeNotificationRequest,
  SendUserWithdrawSettingRequestStateChangeNotificationController,
  UserWithdrawSettingRequestControllerEvent,
} from '@zro/compliance/interface';

export type UserWithdrawSettingRequestEventKafkaRequest =
  KafkaMessage<UserWithdrawSettingRequestControllerEvent>;

/**
 * UserWithdrawSettingRequest notification events observer.
 */
@Controller()
@ObserverController()
export class UserWithdrawSettingRequestStateChangeNotificationNestObserver {
  private translateService: TranslateI18nService;

  constructor(translateService: NestTranslateService) {
    this.translateService = new TranslateI18nService(translateService);
  }

  @KafkaEventPattern(KAFKA_EVENTS.USER_WITHDRAW_SETTING_REQUEST.APPROVED)
  async handleClosedApprovedUserWithdrawSettingRequestEvent(
    @Payload('value') message: UserWithdrawSettingRequestControllerEvent,
    @RepositoryParam(UserWithdrawSettingRequestDatabaseRepository)
    userWithdrawSettingRequestRepository: UserWithdrawSettingRequestRepository,
    @KafkaServiceParam(NotificationServiceKafka)
    notificationService: NotificationServiceKafka,
    @LoggerParam(UserWithdrawSettingRequestStateChangeNotificationNestObserver)
    logger: Logger,
    @RequestId() requestId: string,
  ): Promise<void> {
    return this.handle(
      message,
      userWithdrawSettingRequestRepository,
      notificationService,
      logger,
      requestId,
    );
  }

  @KafkaEventPattern(KAFKA_EVENTS.USER_WITHDRAW_SETTING_REQUEST.REJECTED)
  async handleClosedRejectedUserWithdrawSettingRequestEvent(
    @Payload('value') message: UserWithdrawSettingRequestControllerEvent,
    @RepositoryParam(UserWithdrawSettingRequestDatabaseRepository)
    userWithdrawSettingRequestRepository: UserWithdrawSettingRequestRepository,
    @KafkaServiceParam(NotificationServiceKafka)
    notificationService: NotificationServiceKafka,
    @LoggerParam(UserWithdrawSettingRequestStateChangeNotificationNestObserver)
    logger: Logger,
    @RequestId() requestId: string,
  ): Promise<void> {
    return this.handle(
      message,
      userWithdrawSettingRequestRepository,
      notificationService,
      logger,
      requestId,
    );
  }

  private async handle(
    message: UserWithdrawSettingRequestControllerEvent,
    userWithdrawSettingRequestRepository: UserWithdrawSettingRequestRepository,
    notificationService: NotificationServiceKafka,
    logger: Logger,
    requestId: string,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload =
      new SendUserWithdrawSettingRequestStateChangeNotificationRequest({
        id: message.id,
        state: message.state,
        userId: message.userId,
        notificationId: requestId,
      });

    logger.info('Send user withdraw setting request confirmed notification.', {
      payload,
    });

    const controller =
      new SendUserWithdrawSettingRequestStateChangeNotificationController(
        logger,
        userWithdrawSettingRequestRepository,
        notificationService,
        this.translateService,
      );

    try {
      // Call the user limit request controller.
      const result = await controller.execute(payload);

      logger.info('Confirmed user withdraw setting request notification.', {
        result,
      });
    } catch (error) {
      logger.error(
        'Failed to send confirmed withdraw setting request notification.',
        error,
      );

      // FIXME: Should notify IT team.
    }
  }
}
