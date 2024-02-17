import { Logger } from 'winston';
import { IsInt, IsOptional, IsUUID } from 'class-validator';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  EventEmitterParam,
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
import {
  GlobalLimitRepository,
  LimitTypeRepository,
  UserLimitRepository,
} from '@zro/operations/domain';
import {
  GlobalLimitDatabaseRepository,
  KAFKA_TOPICS,
  LimitTypeDatabaseRepository,
  UserLimitDatabaseRepository,
  UserServiceKafka,
  UserLimitEventKafkaEmitter,
} from '@zro/operations/infrastructure';
import {
  GetUserLimitsByFilterController,
  GetUserLimitsByFilterRequest,
  GetUserLimitsByFilterResponse,
  UserLimitEventEmitterControllerInterface,
} from '@zro/operations/interface';

export class GetUserLimitsByFilterRequestDto
  implements GetUserLimitsByFilterRequest
{
  @IsUUID(4)
  userId?: string;

  @IsOptional()
  @IsInt()
  limitTypeId?: number;

  constructor(props: GetUserLimitsByFilterRequest) {
    Object.assign(this, props);
  }
}

export type GetUserLimitsByFilterResponseDto = GetUserLimitsByFilterResponse;

export type GetUserLimitsByFilterKafkaRequest =
  KafkaMessage<GetUserLimitsByFilterRequestDto>;

export type GetUserLimitsByFilterKafkaResponse =
  KafkaResponse<GetUserLimitsByFilterResponseDto>;

/**
 * User Limit controller.
 */
@Controller()
@MicroserviceController()
export class GetUserLimitsByFilterMicroserviceController {
  /**
   * Default operation RPC controller constructor.
   *
   */
  constructor(@InjectValidator() private validate: Validator) {}

  /**
   * Consumer of get user limits by filter.
   *
   * @param userLimitRepository User limit repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.USER_LIMIT.GET_BY_FILTER)
  async execute(
    @RepositoryParam(UserLimitDatabaseRepository)
    userLimitRepository: UserLimitRepository,
    @RepositoryParam(GlobalLimitDatabaseRepository)
    globalLimitRepository: GlobalLimitRepository,
    @RepositoryParam(LimitTypeDatabaseRepository)
    limitTypeRepository: LimitTypeRepository,
    @KafkaServiceParam(UserServiceKafka)
    userService: UserServiceKafka,
    @EventEmitterParam(UserLimitEventKafkaEmitter)
    userLimitEventEmitter: UserLimitEventEmitterControllerInterface,
    @LoggerParam(GetUserLimitsByFilterMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetUserLimitsByFilterRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetUserLimitsByFilterKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetUserLimitsByFilterRequestDto(message);
    await this.validate(payload);

    // Update user limit controller.
    const controller = new GetUserLimitsByFilterController(
      logger,
      userLimitRepository,
      globalLimitRepository,
      limitTypeRepository,
      userService,
      userLimitEventEmitter,
    );

    const userLimits = await controller.execute(payload);

    logger.debug('User Limits found.', { userLimits });

    return {
      ctx,
      value: userLimits,
    };
  }
}
