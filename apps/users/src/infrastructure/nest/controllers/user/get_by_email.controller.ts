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
  GetUserByEmailController,
  GetUserByEmailRequest,
  GetUserByEmailResponse,
} from '@zro/users/interface';
import {
  KAFKA_TOPICS,
  UserDatabaseRepository,
} from '@zro/users/infrastructure';

export type GetUserByEmailKafkaRequest = KafkaMessage<GetUserByEmailRequest>;
export type GetUserByEmailKafkaResponse = KafkaResponse<GetUserByEmailResponse>;

/**
 * User RPC controller.
 */
@Controller()
@MicroserviceController()
export class GetUserByEmailMicroserviceController {
  /**
   * Consumer of get user by email.
   *
   * @param userRepository User repository.
   * @param message Request Kafka message.
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.USER.GET_BY_EMAIL)
  async execute(
    @RepositoryParam(UserDatabaseRepository)
    userRepository: UserRepository,
    @LoggerParam(GetUserByEmailMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetUserByEmailRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetUserByEmailKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetUserByEmailRequest(message);

    logger.info('Getting user.', { payload });

    // Create and call get user by email controller.
    const controller = new GetUserByEmailController(logger, userRepository);

    // Get user
    const user = await controller.execute(payload);

    logger.info('User found.');

    return {
      ctx,
      value: user,
    };
  }
}
