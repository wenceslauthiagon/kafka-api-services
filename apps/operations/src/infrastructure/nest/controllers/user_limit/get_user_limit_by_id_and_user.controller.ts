import { Logger } from 'winston';
import { IsUUID } from 'class-validator';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  InjectValidator,
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  KafkaServiceParam,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
  Validator,
} from '@zro/common';
import { UserLimitRepository } from '@zro/operations/domain';
import {
  KAFKA_TOPICS,
  UserLimitDatabaseRepository,
  UserServiceKafka,
} from '@zro/operations/infrastructure';
import {
  GetUserLimitByIdAndUserController,
  GetUserLimitByIdAndUserRequest,
  GetUserLimitByIdAndUserResponse,
} from '@zro/operations/interface';

export class GetUserLimitByIdAndUserRequestDto
  implements GetUserLimitByIdAndUserRequest
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  userId: string;

  constructor(props: GetUserLimitByIdAndUserRequest) {
    Object.assign(this, props);
  }
}

export type GetUserLimitByIdAndUserResponseDto =
  GetUserLimitByIdAndUserResponse;

export type GetUserLimitByIdAndUserKafkaRequest =
  KafkaMessage<GetUserLimitByIdAndUserRequestDto>;

export type GetUserLimitByIdAndUserKafkaResponse =
  KafkaResponse<GetUserLimitByIdAndUserResponseDto>;

/**
 * User Limit controller.
 */
@Controller()
@MicroserviceController()
export class GetUserLimitByIdAndUserMicroserviceController {
  /**
   * Default operation RPC controller constructor.
   *
   */
  constructor(@InjectValidator() private validate: Validator) {}

  /**
   * Consumer of get user limit by id and user.
   *
   * @param userLimitRepository User limit repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.USER_LIMIT.GET_BY_ID)
  async execute(
    @RepositoryParam(UserLimitDatabaseRepository)
    userLimitRepository: UserLimitRepository,
    @KafkaServiceParam(UserServiceKafka)
    userService: UserServiceKafka,
    @LoggerParam(GetUserLimitByIdAndUserMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetUserLimitByIdAndUserRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetUserLimitByIdAndUserKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetUserLimitByIdAndUserRequestDto(message);
    await this.validate(payload);

    // Get user limit by id and user controller.
    const controller = new GetUserLimitByIdAndUserController(
      logger,
      userLimitRepository,
      userService,
    );

    const userLimit = await controller.execute(payload);

    logger.debug('User Limit found.', { userLimit });

    return {
      ctx,
      value: userLimit,
    };
  }
}
