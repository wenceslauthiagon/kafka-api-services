import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';
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
  UpdateUserPinAttemptsController,
  UpdateUserPinAttemptsRequest,
  UpdateUserPinAttemptsResponse,
  UserPinAttemptsEventEmitterControllerInterface,
} from '@zro/users/interface';
import {
  KAFKA_TOPICS,
  UserDatabaseRepository,
  UserPinAttemptsDatabaseRepository,
  UserPinAttemptsEventKafkaEmitter,
} from '@zro/users/infrastructure';

export class UpdateUserPinAttemptsRequestDto
  implements UpdateUserPinAttemptsRequest
{
  @IsUUID(4)
  userId: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  attempts?: number;

  constructor(props: UpdateUserPinAttemptsRequest) {
    Object.assign(this, props);
  }
}

export type UpdateUserPinAttemptsResponseDto = UpdateUserPinAttemptsResponse;

export type UpdateUserPinAttemptsKafkaRequest =
  KafkaMessage<UpdateUserPinAttemptsRequestDto>;

export type UpdateUserPinAttemptsKafkaResponse =
  KafkaResponse<UpdateUserPinAttemptsResponseDto>;

/**
 * Update user pin attempts RPC controller.
 */
@Controller()
@MicroserviceController()
export class UpdateUserPinAttemptMicroserviceController {
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
  @KafkaMessagePattern(KAFKA_TOPICS.USER_PIN_ATTEMPTS.UPDATE)
  async execute(
    @RepositoryParam(UserDatabaseRepository)
    userRepository: UserRepository,
    @RepositoryParam(UserPinAttemptsDatabaseRepository)
    userPinAttemptsRepository: UserPinAttemptsRepository,
    @EventEmitterParam(UserPinAttemptsEventKafkaEmitter)
    eventEmitter: UserPinAttemptsEventEmitterControllerInterface,
    @LoggerParam(UpdateUserPinAttemptMicroserviceController)
    logger: Logger,
    @Payload('value') message: UpdateUserPinAttemptsRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<UpdateUserPinAttemptsKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new UpdateUserPinAttemptsRequestDto(message);
    await this.validate(payload);

    logger.info('Update user pin attempts.', { payload });

    // Create update controller.
    const controller = new UpdateUserPinAttemptsController(
      logger,
      userRepository,
      userPinAttemptsRepository,
      eventEmitter,
    );

    // Update user pin attempts.
    const userPinAttempts = await controller.execute(payload);

    logger.info('User pin attempts updated.', { userPinAttempts });

    return {
      ctx,
      value: userPinAttempts,
    };
  }
}
