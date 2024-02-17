import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  EventEmitterParam,
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import {
  UserRepository,
  UserForgotPasswordRepository,
} from '@zro/users/domain';
import {
  UpdateUserPinController,
  UpdateUserPinRequest,
  UpdateUserPinResponse,
  UserEventEmitterControllerInterface,
} from '@zro/users/interface';
import {
  UserDatabaseRepository,
  UserForgotPasswordDatabaseRepository,
  KAFKA_TOPICS,
  UserEventKafkaEmitter,
} from '@zro/users/infrastructure';

export type UpdateUserPinKafkaRequest = KafkaMessage<UpdateUserPinRequest>;
export type UpdateUserPinKafkaResponse = KafkaResponse<UpdateUserPinResponse>;

/**
 * Update user pin controller.
 */
@Controller()
@MicroserviceController()
export class UpdateUserPinMicroserviceController {
  /**
   * Parse update user pin message and call update user pin controller.
   *
   * @param userRepository User repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.USER.UPDATE_USER_PIN)
  async execute(
    @RepositoryParam(UserDatabaseRepository)
    userRepository: UserRepository,
    @RepositoryParam(UserForgotPasswordDatabaseRepository)
    userForgotPasswordRepository: UserForgotPasswordRepository,
    @EventEmitterParam(UserEventKafkaEmitter)
    userEventEmitter: UserEventEmitterControllerInterface,
    @LoggerParam(UpdateUserPinMicroserviceController)
    logger: Logger,
    @Payload('value') message: UpdateUserPinRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<UpdateUserPinKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new UpdateUserPinRequest(message);

    logger.info('Update user pin.', { payload });

    // Create update user pin controller.
    const controller = new UpdateUserPinController(
      logger,
      userRepository,
      userForgotPasswordRepository,
      userEventEmitter,
    );

    // Update user pin.
    const updatedUser = await controller.execute(payload);

    logger.info('User pin updated.', { updatedUser });

    return {
      ctx,
      value: updatedUser,
    };
  }
}
