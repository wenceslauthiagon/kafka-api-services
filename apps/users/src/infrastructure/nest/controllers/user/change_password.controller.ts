import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { Logger } from 'winston';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { UserRepository } from '@zro/users/domain';
import {
  ChangeUserPasswordController,
  ChangeUserPasswordRequest,
  ChangeUserPasswordResponse,
} from '@zro/users/interface';
import {
  KAFKA_TOPICS,
  UserDatabaseRepository,
} from '@zro/users/infrastructure';

export type ChangeUserPasswordKafkaRequest =
  KafkaMessage<ChangeUserPasswordRequest>;
export type ChangeUserPasswordKafkaResponse =
  KafkaResponse<ChangeUserPasswordResponse>;

/**
 * User RPC controller.
 */
@Controller()
@MicroserviceController()
export class ChangeUserPasswordMicroserviceController {
  /**
   * Consumer of change user password.
   *
   * @param userRepository User repository.
   * @param message Request Kafka message.
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.USER.CHANGE_PASSWORD)
  async execute(
    @RepositoryParam(UserDatabaseRepository)
    userRepository: UserRepository,
    @LoggerParam(ChangeUserPasswordMicroserviceController)
    logger: Logger,
    @Payload('value') message: ChangeUserPasswordRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<ChangeUserPasswordKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Load and validate message payload.
    const payload = new ChangeUserPasswordRequest(message);

    // Create and call change user password controller.
    const controller = new ChangeUserPasswordController(logger, userRepository);

    // User updated.
    const userUpdated = await controller.execute(payload);

    logger.info('User updated.', { userUpdated });

    return {
      ctx,
      value: userUpdated,
    };
  }
}
