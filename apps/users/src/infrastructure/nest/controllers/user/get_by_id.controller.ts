import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { Logger } from 'winston';
import {
  CacheTTL,
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { UserRepository } from '@zro/users/domain';
import {
  GetUserByIdController,
  GetUserByIdRequest,
  GetUserByIdResponse,
} from '@zro/users/interface';
import {
  KAFKA_TOPICS,
  UserDatabaseRepository,
} from '@zro/users/infrastructure';

export type GetUserByIdKafkaRequest = KafkaMessage<GetUserByIdRequest>;
export type GetUserByIdKafkaResponse = KafkaResponse<GetUserByIdResponse>;

/**
 * User RPC controller.
 */
@Controller()
@CacheTTL()
@MicroserviceController()
export class GetUserByIdMicroserviceController {
  /**
   * Consumer of get user by id.
   *
   * @param userRepository User repository.
   * @param message Request Kafka message.
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.USER.GET_BY_ID)
  async execute(
    @RepositoryParam(UserDatabaseRepository)
    userRepository: UserRepository,
    @LoggerParam(GetUserByIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetUserByIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetUserByIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetUserByIdRequest(message);

    logger.info('Getting user.', { payload });

    // Create and call get user by uuid controller.
    const controller = new GetUserByIdController(logger, userRepository);

    // Get user
    const user = await controller.execute(payload);

    logger.info('User found.', { user });

    return {
      ctx,
      value: user,
    };
  }
}
