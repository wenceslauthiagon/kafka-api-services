import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  RepositoryParam,
  ObserverController,
  EventEmitterParam,
  KafkaServiceParam,
} from '@zro/common';
import { UserWithdrawSettingRequestRepository } from '@zro/compliance/domain';
import {
  OperationService,
  UserService,
  UserWithdrawSettingRequestGateway,
} from '@zro/compliance/application';
import {
  KAFKA_EVENTS,
  OperationServiceKafka,
  UserServiceKafka,
  UserWithdrawSettingRequestDatabaseRepository,
  UserWithdrawSettingRequestEventKafkaEmitter,
} from '@zro/compliance/infrastructure';
import {
  HandleUserWithdrawSettingRequestFailedController,
  HandleUserWithdrawSettingRequestFailedRequest,
  HandleUserWithdrawSettingRequestPendingController,
  HandleUserWithdrawSettingRequestPendingRequest,
  UserWithdrawSettingRequestEventEmitterControllerInterface,
} from '@zro/compliance/interface';
import {
  JiraUserWithdrawSettingRequestGatewayParam,
  JiraUserWithdrawSettingRequestInterceptor,
} from '@zro/jira';

export type HandleUserWithdrawSettingRequestPendingKafkaRequest =
  KafkaMessage<HandleUserWithdrawSettingRequestPendingRequest>;

/**
 * Pending user withdraw setting request event.
 */
@Controller()
@ObserverController([JiraUserWithdrawSettingRequestInterceptor])
export class HandleUserWithdrawSettingRequestPendingNestObserver {
  /**
   * Handle pending user withdraw setting request event.
   *
   * @param message Event Kafka message.
   * @param userLimitRequestRepository User limit request repository.
   * @param userLimitRequestEventEmitter User limit request event emitter.
   * @param userLimitRequestGateway User limit request gateway.
   * @param logger Local logger instance.
   */
  @KafkaEventPattern(KAFKA_EVENTS.USER_WITHDRAW_SETTING_REQUEST.PENDING)
  async execute(
    @Payload('value') message: HandleUserWithdrawSettingRequestPendingRequest,
    @RepositoryParam(UserWithdrawSettingRequestDatabaseRepository)
    userWithdrawSettingRequestRepository: UserWithdrawSettingRequestRepository,
    @JiraUserWithdrawSettingRequestGatewayParam()
    userWithdrawSettingRequestGateway: UserWithdrawSettingRequestGateway,
    @EventEmitterParam(UserWithdrawSettingRequestEventKafkaEmitter)
    userWithdrawSettingRequestEventEmitter: UserWithdrawSettingRequestEventEmitterControllerInterface,
    @KafkaServiceParam(UserServiceKafka)
    userService: UserService,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationService,
    @LoggerParam(HandleUserWithdrawSettingRequestPendingNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleUserWithdrawSettingRequestPendingRequest({
      id: message.id,
    });

    logger.debug('Creating user withdraw setting request at Jira.', {
      payload,
    });

    const controller = new HandleUserWithdrawSettingRequestPendingController(
      logger,
      userWithdrawSettingRequestRepository,
      userWithdrawSettingRequestGateway,
      userWithdrawSettingRequestEventEmitter,
      userService,
      operationService,
    );

    try {
      // Call handle open pending user withdraw setting request event controller.
      await controller.execute(payload);

      logger.info('Pending user withdraw setting request event handled.');
    } catch (error) {
      // TODO: Enviar notificação para a fila de retry
      // Isso aqui é temporário e deverá ser substituido o mais breve possível

      logger.error('Failed to handle user withdraw setting request event.', {
        error,
      });

      const failedController =
        new HandleUserWithdrawSettingRequestFailedController(
          logger,
          userWithdrawSettingRequestRepository,
          userWithdrawSettingRequestEventEmitter,
        );

      // Call handle failed user withdraw setting request event controller.
      const failedPayload = new HandleUserWithdrawSettingRequestFailedRequest({
        id: message.id,
      });

      await failedController.execute(failedPayload);
    }
  }
}
