import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { IsUUID } from 'class-validator';
import { Logger } from 'winston';
import {
  EventEmitterParam,
  InjectValidator,
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
  Validator,
} from '@zro/common';
import { UserPinAttemptsRepository, UserRepository } from '@zro/users/domain';
import {
  GetUserPinAttemptsByUserController,
  GetUserPinAttemptsByUserRequest,
  GetUserPinAttemptsByUserResponse,
  UserPinAttemptsEventEmitterControllerInterface,
} from '@zro/users/interface';
import {
  KAFKA_TOPICS,
  UserDatabaseRepository,
  UserPinAttemptsDatabaseRepository,
  UserPinAttemptsEventKafkaEmitter,
} from '@zro/users/infrastructure';

export class GetUserPinAttemptsByUserRequestDto
  implements GetUserPinAttemptsByUserRequest
{
  @IsUUID(4)
  userId: string;

  constructor(props: GetUserPinAttemptsByUserRequest) {
    Object.assign(this, props);
  }
}

export type GetUserPinAttemptsByUserResponseDto =
  GetUserPinAttemptsByUserResponse;

export type GetUserPinAttemptsByUserKafkaRequest =
  KafkaMessage<GetUserPinAttemptsByUserRequestDto>;

export type GetUserPinAttemptsByUserKafkaResponse =
  KafkaResponse<GetUserPinAttemptsByUserResponseDto>;

/**
 * Get user pin attempts by user RPC controller.
 */
@Controller()
@MicroserviceController()
export class GetUserPinAttemptByUserMicroserviceController {
  /**
   * Default RPC controller constructor.
   */
  constructor(@InjectValidator() private validate: Validator) {}

  /**
   * Call get user pin attempts by user controller.
   *
   * @param userRepository User repository.
   * @param userPinAttemptsRepository User pin attempts repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.USER_PIN_ATTEMPTS.GET_BY_USER)
  async execute(
    @RepositoryParam(UserDatabaseRepository)
    userRepository: UserRepository,
    @RepositoryParam(UserPinAttemptsDatabaseRepository)
    userPinAttemptsRepository: UserPinAttemptsRepository,
    @EventEmitterParam(UserPinAttemptsEventKafkaEmitter)
    eventEmitter: UserPinAttemptsEventEmitterControllerInterface,
    @LoggerParam(GetUserPinAttemptByUserMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetUserPinAttemptsByUserRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetUserPinAttemptsByUserKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetUserPinAttemptsByUserRequestDto(message);
    await this.validate(payload);

    logger.info('Getting user pin attempts by user.', { payload });

    // Create get controller.
    const controller = new GetUserPinAttemptsByUserController(
      logger,
      userRepository,
      userPinAttemptsRepository,
      eventEmitter,
    );

    // Get user pin attempts.
    const userPinAttempts = await controller.execute(payload);

    logger.info('User pin attempts found.', { userPinAttempts });

    return {
      ctx,
      value: userPinAttempts,
    };
  }
}
