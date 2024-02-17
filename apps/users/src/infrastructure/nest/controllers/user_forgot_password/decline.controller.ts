import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { Logger } from 'winston';
import {
  EventEmitterParam,
  KafkaMessage,
  KafkaMessagePattern,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { UserForgotPasswordRepository } from '@zro/users/domain';
import {
  DeclineUserForgotPasswordController,
  DeclineUserForgotPasswordRequest,
  UserForgotPasswordEventEmitterControllerInterface,
} from '@zro/users/interface';
import {
  KAFKA_TOPICS,
  UserForgotPasswordDatabaseRepository,
  UserForgotPasswordEventKafkaEmitter,
} from '@zro/users/infrastructure';

export type DeclineUserForgotPasswordKafkaRequest =
  KafkaMessage<DeclineUserForgotPasswordRequest>;

/**
 * UserForgotPassword RPC controller.
 */
@Controller()
@MicroserviceController()
export class DeclineUserForgotPasswordMicroserviceController {
  /**
   * Consumer of declone user forgot password.
   *
   * @param userForgotPasswordRepository UserForgotPassword repository.
   * @param userForgotPasswordEventEmitter UserForgotPassword event emitter.
   * @param message Request Kafka message.
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.USER_FORGOT_PASSWORD.DECLINE)
  async execute(
    @RepositoryParam(UserForgotPasswordDatabaseRepository)
    userForgotPasswordRepository: UserForgotPasswordRepository,
    @EventEmitterParam(UserForgotPasswordEventKafkaEmitter)
    userForgotPasswordEventEmitter: UserForgotPasswordEventEmitterControllerInterface,
    @LoggerParam(DeclineUserForgotPasswordMicroserviceController)
    logger: Logger,
    @Payload('value') message: DeclineUserForgotPasswordRequest,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Load and validate message payload.
    const payload = new DeclineUserForgotPasswordRequest(message);

    // Decline and call create user forgot password controller.
    const controller = new DeclineUserForgotPasswordController(
      logger,
      userForgotPasswordRepository,
      userForgotPasswordEventEmitter,
    );

    // Decline user forgot password
    await controller.execute(payload);

    logger.info('UserForgotPassword declined.');
  }
}
