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
  GetUserByUuidController,
  GetUserByUuidRequest,
  GetUserByUuidResponse,
} from '@zro/users/interface';
import {
  KAFKA_TOPICS,
  UserDatabaseRepository,
} from '@zro/users/infrastructure';

export type GetUserByUuidKafkaRequest = KafkaMessage<GetUserByUuidRequest>;
export type GetUserByUuidKafkaResponse = KafkaResponse<GetUserByUuidResponse>;

/**
 * User RPC controller.
 */
@Controller()
@MicroserviceController()
export class GetUserByUuidMicroserviceController {
  /**
   * Consumer of get user by uuid.
   *
   * @param userRepository User repository.
   * @param message Request Kafka message.
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.USER.GET_BY_UUID)
  async execute(
    @RepositoryParam(UserDatabaseRepository)
    userRepository: UserRepository,
    @LoggerParam(GetUserByUuidMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetUserByUuidRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetUserByUuidKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetUserByUuidRequest(message);

    logger.info('Getting user.', { payload });

    // Create and call get user by uuid controller.
    const controller = new GetUserByUuidController(logger, userRepository);

    // Get user
    const user = await controller.execute(payload);

    logger.info('User found.', { user });

    return {
      ctx,
      value: user,
    };
  }
}
