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
  GetUserByDocumentController,
  GetUserByDocumentRequest,
  GetUserByDocumentResponse,
} from '@zro/users/interface';
import {
  KAFKA_TOPICS,
  UserDatabaseRepository,
} from '@zro/users/infrastructure';

export type GetUserByDocumentKafkaRequest =
  KafkaMessage<GetUserByDocumentRequest>;
export type GetUserByDocumentKafkaResponse =
  KafkaResponse<GetUserByDocumentResponse>;

/**
 * User RPC controller.
 */
@Controller()
@MicroserviceController()
export class GetUserByDocumentMicroserviceController {
  /**
   * Consumer of get user by document.
   *
   * @param userRepository User repository.
   * @param message Request Kafka message.
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.USER.GET_BY_DOCUMENT)
  async execute(
    @RepositoryParam(UserDatabaseRepository)
    userRepository: UserRepository,
    @LoggerParam(GetUserByDocumentMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetUserByDocumentRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetUserByDocumentKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Load and validate message payload.
    const payload = new GetUserByDocumentRequest(message);

    // Create and call get user by document controller.
    const controller = new GetUserByDocumentController(logger, userRepository);

    // Get user
    const user = await controller.execute(payload);

    logger.info('User found.', { user });

    return {
      ctx,
      value: user,
    };
  }
}
