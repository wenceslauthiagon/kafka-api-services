import { Logger } from 'winston';
import { IsInt, IsOptional, IsUUID } from 'class-validator';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
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
} from '@zro/common';
import { UserLimitRepository } from '@zro/operations/domain';
import {
  KAFKA_TOPICS,
  UserLimitEventKafkaEmitter,
  UserLimitDatabaseRepository,
} from '@zro/operations/infrastructure';
import {
  UpdateUserLimitByAdminController,
  UpdateUserLimitByAdminRequest,
  UpdateUserLimitByAdminResponse,
  UserLimitEventEmitterControllerInterface,
} from '@zro/operations/interface';

export class UpdateUserLimitByAdminRequestDto
  implements UpdateUserLimitByAdminRequest
{
  @IsUUID(4)
  userLimitId: string;

  @IsInt()
  @IsOptional()
  yearlyLimit?: number;

  @IsInt()
  @IsOptional()
  monthlyLimit?: number;

  @IsInt()
  @IsOptional()
  dailyLimit?: number;

  @IsInt()
  @IsOptional()
  nightlyLimit?: number;

  @IsInt()
  @IsOptional()
  maxAmount?: number;

  @IsInt()
  @IsOptional()
  minAmount?: number;

  @IsInt()
  @IsOptional()
  maxAmountNightly?: number;

  @IsInt()
  @IsOptional()
  minAmountNightly?: number;

  constructor(props: UpdateUserLimitByAdminRequest) {
    Object.assign(this, props);
  }
}

export type UpdateUserLimitByAdminResponseDto = UpdateUserLimitByAdminResponse;

export type UpdateUserLimitByAdminKafkaRequest =
  KafkaMessage<UpdateUserLimitByAdminRequestDto>;

export type UpdateUserLimitByAdminKafkaResponse =
  KafkaResponse<UpdateUserLimitByAdminResponseDto>;

/**
 * User Limit controller.
 */
@Controller()
@MicroserviceController()
export class UpdateUserLimitByAdminMicroserviceController {
  /**
   * Default remittance RPC controller constructor.
   */
  constructor(@InjectValidator() private validate: Validator) {}

  /**
   * Consumer of update user limit by admin.
   *
   * @param userLimitRepository User limit repository.
   * @param userLimitEventEmitter User limit event emitter.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.USER_LIMIT.UPDATE_BY_ADMIN)
  async execute(
    @RepositoryParam(UserLimitDatabaseRepository)
    userLimitRepository: UserLimitRepository,
    @EventEmitterParam(UserLimitEventKafkaEmitter)
    userLimitEventEmitter: UserLimitEventEmitterControllerInterface,
    @LoggerParam(UpdateUserLimitByAdminMicroserviceController) logger: Logger,
    @Payload('value') message: UpdateUserLimitByAdminRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<UpdateUserLimitByAdminKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new UpdateUserLimitByAdminRequestDto(message);
    await this.validate(payload);

    // Update user limit controller.
    const controller = new UpdateUserLimitByAdminController(
      logger,
      userLimitRepository,
      userLimitEventEmitter,
    );

    const userLimitUpdated = await controller.execute(payload);

    logger.debug('User Limit updated by admin.', { userLimitUpdated });

    return {
      ctx,
      value: userLimitUpdated,
    };
  }
}
