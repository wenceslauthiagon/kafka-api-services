import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import {
  EventEmitterParam,
  KafkaMessage,
  KafkaMessagePattern,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { UserLimitRequestRepository } from '@zro/compliance/domain';
import {
  CloseUserLimitRequest,
  CloseUserLimitRequestController,
  UserLimitRequestEventEmitterControllerInterface,
} from '@zro/compliance/interface';
import {
  KAFKA_TOPICS,
  UserLimitRequestDatabaseRepository,
  UserLimitRequestEventKafkaEmitter,
} from '@zro/compliance/infrastructure';

export type CloseUserLimitRequestKafkaRequest =
  KafkaMessage<CloseUserLimitRequest>;

/**
 * User RPC controller.
 */
@Controller()
@MicroserviceController()
export class CloseUserLimitRequestMicroserviceController {
  /**
   * Consumer of close user limit request.
   *
   * @param userRepository User repository.
   * @param message Request Kafka message.
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.USER_LIMIT_REQUEST.CLOSE)
  async execute(
    @RepositoryParam(UserLimitRequestDatabaseRepository)
    userLimitRequestRepository: UserLimitRequestRepository,
    @EventEmitterParam(UserLimitRequestEventKafkaEmitter)
    userLimitRequestEventEmitter: UserLimitRequestEventEmitterControllerInterface,
    @LoggerParam(CloseUserLimitRequestMicroserviceController)
    logger: Logger,
    @Payload('value') message: CloseUserLimitRequest,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Load and validate message payload.
    const payload = new CloseUserLimitRequest(message);

    // Close and call close user limit request controller.
    const controller = new CloseUserLimitRequestController(
      logger,
      userLimitRequestRepository,
      userLimitRequestEventEmitter,
    );

    await controller.execute(payload);

    logger.info('User limit request closed.');
  }
}
