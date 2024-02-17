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
  GetUserHasPinController,
  GetUserHasPinRequest,
  GetUserHasPinResponse,
} from '@zro/users/interface';
import {
  KAFKA_TOPICS,
  UserDatabaseRepository,
} from '@zro/users/infrastructure';

export type GetUserHasPinKafkaRequest = KafkaMessage<GetUserHasPinRequest>;
export type GetUserHasPinKafkaResponse = KafkaResponse<GetUserHasPinResponse>;

/**
 * User RPC controller.
 */
@Controller()
@MicroserviceController()
export class GetUserHasPinMicroserviceController {
  /**
   * Consumer of get user by document.
   *
   * @param userRepository User repository.
   * @param message Request Kafka message.
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.USER.GET_USER_HAS_PIN)
  async execute(
    @RepositoryParam(UserDatabaseRepository)
    userRepository: UserRepository,
    @LoggerParam(GetUserHasPinMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetUserHasPinRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetUserHasPinKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Load and validate message payload.
    const payload = new GetUserHasPinRequest(message);

    // Create and call get user by document controller.
    const controller = new GetUserHasPinController(logger, userRepository);

    // Get user
    const userHasPin = await controller.execute(payload);

    logger.info('User has pin.', { userHasPin });

    return {
      ctx,
      value: userHasPin,
    };
  }
}
