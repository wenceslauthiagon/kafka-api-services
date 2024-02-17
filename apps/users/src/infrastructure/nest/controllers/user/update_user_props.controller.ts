import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
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
  UpdateUserPropsController,
  UpdateUserPropsRequest,
  UpdateUserPropsResponse,
} from '@zro/users/interface';
import {
  UserDatabaseRepository,
  KAFKA_TOPICS,
} from '@zro/users/infrastructure';

export type UpdateUserPropsKafkaRequest = KafkaMessage<UpdateUserPropsRequest>;
export type UpdateUserPropsKafkaResponse =
  KafkaResponse<UpdateUserPropsResponse>;

/**
 * Update user props controller.
 */
@Controller()
@MicroserviceController()
export class UpdateUserPropsMicroserviceController {
  /**
   * Parse update user props message and call update user props controller.
   *
   * @param userRepository User repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.USER.UPDATE_USER_PROPS)
  async execute(
    @RepositoryParam(UserDatabaseRepository)
    userRepository: UserRepository,
    @LoggerParam(UpdateUserPropsMicroserviceController)
    logger: Logger,
    @Payload('value') message: UpdateUserPropsRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<UpdateUserPropsKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new UpdateUserPropsRequest(message);

    logger.info('Update user props.', { payload });

    // Create update user props controller.
    const controller = new UpdateUserPropsController(logger, userRepository);

    // Update user props.
    const updatedUser = await controller.execute(payload);

    logger.info('User props updated.', { updatedUser });

    return {
      ctx,
      value: updatedUser,
    };
  }
}
