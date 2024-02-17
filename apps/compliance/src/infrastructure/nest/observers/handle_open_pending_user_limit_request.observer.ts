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
import {
  JiraIssueUserLimitRequestInterceptor,
  JiraIssueUserLimitRequestGatewayParam,
} from '@zro/jira';
import { UserLimitRequestRepository } from '@zro/compliance/domain';
import {
  UserLimitRequestGateway,
  UserService,
} from '@zro/compliance/application';
import {
  KAFKA_EVENTS,
  UserLimitRequestDatabaseRepository,
  UserLimitRequestEventKafkaEmitter,
  UserServiceKafka,
} from '@zro/compliance/infrastructure';
import {
  HandleOpenPendingUserLimitRequest,
  HandleOpenPendingUserLimitRequestController,
  UserLimitRequestEventEmitterControllerInterface,
} from '@zro/compliance/interface';

export type HandleOpenPendingUserLimitRequestKafkaRequest =
  KafkaMessage<HandleOpenPendingUserLimitRequest>;

/**
 * Pending user events observer.
 */
@Controller()
@ObserverController([JiraIssueUserLimitRequestInterceptor])
export class HandleOpenPendingUserLimitRequestNestObserver {
  /**
   * Handle open pending user limit request event.
   *
   * @param message Event Kafka message.
   * @param userLimitRequestRepository User limit request repository.
   * @param userLimitRequestEventEmitter User limit request event emitter.
   * @param userLimitRequestGateway User limit request gateway.
   * @param logger Local logger instance.
   */
  @KafkaEventPattern(KAFKA_EVENTS.USER_LIMIT_REQUEST.OPEN_PENDING)
  async execute(
    @Payload('value') message: HandleOpenPendingUserLimitRequest,
    @JiraIssueUserLimitRequestGatewayParam()
    issueUserLimitRequestGateway: UserLimitRequestGateway,
    @RepositoryParam(UserLimitRequestDatabaseRepository)
    userLimitRequestRepository: UserLimitRequestRepository,
    @EventEmitterParam(UserLimitRequestEventKafkaEmitter)
    userLimitRequestEventEmitter: UserLimitRequestEventEmitterControllerInterface,
    @KafkaServiceParam(UserServiceKafka)
    userService: UserService,
    @LoggerParam(HandleOpenPendingUserLimitRequestNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = message;

    logger.info('Handle revert event payment.', { payload });

    const controller = new HandleOpenPendingUserLimitRequestController(
      logger,
      userLimitRequestRepository,
      userLimitRequestEventEmitter,
      issueUserLimitRequestGateway,
      userService,
    );

    try {
      // Call handle open pending user limit request event controller.
      await controller.execute(payload);

      logger.info('Pending open pending user limit request event handled.');
    } catch (error) {
      logger.error('Failed to handle open pending user limit request event.', {
        error,
      });
      // FIXME: Should notify IT team.
    }
  }
}
