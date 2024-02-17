import { Logger } from 'winston';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  InjectValidator,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
  Validator,
  EventEmitterParam,
  MissingEnvVarException,
  KafkaServiceParam,
} from '@zro/common';
import {
  GlobalLimitRepository,
  LimitTypeRepository,
  UserLimitRepository,
} from '@zro/operations/domain';
import {
  UpdateUserLimitController,
  UpdateUserLimitRequest,
  UpdateUserLimitResponse,
  UserLimitEventEmitterControllerInterface,
} from '@zro/operations/interface';
import {
  KAFKA_TOPICS,
  LimitTypeDatabaseRepository,
  UserLimitEventKafkaEmitter,
  GlobalLimitDatabaseRepository,
  UserLimitDatabaseRepository,
  UserServiceKafka,
} from '@zro/operations/infrastructure';

export interface UserLimitConfig {
  APP_NIGHTTIME_INTERVALS: string;
}

export class UpdateUserLimitRequestDto implements UpdateUserLimitRequest {
  @IsUUID(4)
  userId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  limitTypesIds: number[];

  @IsInt()
  @IsOptional()
  userMaxAmount?: number;

  @IsInt()
  @IsOptional()
  userMinAmount?: number;

  @IsInt()
  @IsOptional()
  userMaxAmountNightly?: number;

  @IsInt()
  @IsOptional()
  userMinAmountNightly?: number;

  @IsInt()
  @IsOptional()
  userNightlyLimit?: number;

  @IsInt()
  @IsOptional()
  userDailyLimit?: number;

  @IsInt()
  @IsOptional()
  userMonthlyLimit?: number;

  @IsInt()
  @IsOptional()
  userYearlyLimit?: number;

  @IsString()
  @IsOptional()
  @MaxLength(5)
  nighttimeStart?: string;

  @IsString()
  @IsOptional()
  @MaxLength(5)
  nighttimeEnd?: string;

  constructor(props: UpdateUserLimitRequest) {
    Object.assign(this, props);
  }
}

export type UpdateUserLimitResponseDto = UpdateUserLimitResponse;

export type UpdateUserLimitKafkaRequest =
  KafkaMessage<UpdateUserLimitRequestDto>;

export type UpdateUserLimitKafkaResponse =
  KafkaResponse<UpdateUserLimitResponseDto>;

/**
 * User Limit controller.
 */
@Controller()
@MicroserviceController()
export class UpdateUserLimitMicroserviceController {
  private readonly nighttimeIntervals: string;

  /**
   * Default remittance RPC controller constructor.
   */
  constructor(
    @InjectValidator() private validate: Validator,
    private configService: ConfigService<UserLimitConfig>,
  ) {
    this.nighttimeIntervals = this.configService.get<string>(
      'APP_NIGHTTIME_INTERVALS',
    );

    if (!this.nighttimeIntervals) {
      throw new MissingEnvVarException(['APP_NIGHTTIME_INTERVALS']);
    }
  }

  /**
   * Consumer of update user limit.
   *
   * @param userLimitRepository User limit repository.
   * @param globalLimitRepository User limit repository.
   * @param userLimitEventEmitter User limit event emitter.
   * @param limitTypeRepository Limit type repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.USER_LIMIT.UPDATE)
  async execute(
    @RepositoryParam(UserLimitDatabaseRepository)
    userLimitRepository: UserLimitRepository,
    @RepositoryParam(GlobalLimitDatabaseRepository)
    globalLimitRepository: GlobalLimitRepository,
    @RepositoryParam(LimitTypeDatabaseRepository)
    limitTypeRepository: LimitTypeRepository,
    @EventEmitterParam(UserLimitEventKafkaEmitter)
    userLimitEventEmitter: UserLimitEventEmitterControllerInterface,
    @KafkaServiceParam(UserServiceKafka)
    userService: UserServiceKafka,
    @LoggerParam(UpdateUserLimitMicroserviceController) logger: Logger,
    @Payload('value') message: UpdateUserLimitRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<UpdateUserLimitKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new UpdateUserLimitRequestDto(message);
    await this.validate(payload);

    // Update user limit controller.
    const controller = new UpdateUserLimitController(
      logger,
      userLimitRepository,
      globalLimitRepository,
      limitTypeRepository,
      userLimitEventEmitter,
      this.nighttimeIntervals,
      userService,
    );

    const userLimitUpdated = await controller.execute(payload);

    logger.debug('User Limit updated.', { userLimitUpdated });

    return {
      ctx,
      value: userLimitUpdated,
    };
  }
}
