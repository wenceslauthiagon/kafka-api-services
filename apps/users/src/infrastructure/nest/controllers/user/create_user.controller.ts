import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { Logger } from 'winston';
import {
  BcryptHashService,
  EventEmitterParam,
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { UserRepository } from '@zro/users/domain';
import {
  CreateUserController,
  CreateUserRequest,
  CreateUserResponse,
  UserEventEmitterControllerInterface,
} from '@zro/users/interface';
import {
  KAFKA_TOPICS,
  UserDatabaseRepository,
  UserEventKafkaEmitter,
} from '@zro/users/infrastructure';

export type CreateUserKafkaRequest = KafkaMessage<CreateUserRequest>;
export type CreateUserKafkaResponse = KafkaResponse<CreateUserResponse>;

/**
 * User RPC controller.
 */
@Controller()
@MicroserviceController()
export class CreateUserMicroserviceController {
  constructor(private hashProvider: BcryptHashService) {}

  /**
   * Consumer of create user.
   *
   * @param userRepository User repository.
   * @param message Request Kafka message.
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.USER.CREATE)
  async execute(
    @RepositoryParam(UserDatabaseRepository)
    userRepository: UserRepository,
    @LoggerParam(CreateUserMicroserviceController)
    logger: Logger,
    @EventEmitterParam(UserEventKafkaEmitter)
    userEventEmitter: UserEventEmitterControllerInterface,
    @Payload('value') message: CreateUserRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateUserKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Load and validate message payload.
    const payload = new CreateUserRequest(message);

    // Create and call get user by cpf controller.
    const controller = new CreateUserController(
      logger,
      userRepository,
      userEventEmitter,
      this.hashProvider,
    );

    // Create user
    const user = await controller.execute(payload);

    logger.info('User created.', { user });

    return {
      ctx,
      value: user,
    };
  }
}
