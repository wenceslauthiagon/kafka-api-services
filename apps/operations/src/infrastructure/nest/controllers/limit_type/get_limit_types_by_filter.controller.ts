import { Logger } from 'winston';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
  PaginationRequest,
  Validator,
  InjectValidator,
  Sort,
  PaginationSort,
} from '@zro/common';
import { LimitTypeRepository } from '@zro/operations/domain';
import {
  KAFKA_TOPICS,
  LimitTypeDatabaseRepository,
} from '@zro/operations/infrastructure';
import {
  GetLimitTypesByFilterController,
  GetLimitTypesByFilterRequest,
  GetLimitTypesByFilterRequestSort,
  GetLimitTypesByFilterResponse,
} from '@zro/operations/interface';

export class GetLimitTypesByFilterRequestDto
  extends PaginationRequest
  implements GetLimitTypesByFilterRequest
{
  @IsOptional()
  @Sort(GetLimitTypesByFilterRequestSort)
  sort?: PaginationSort;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  tag?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  transactionTypeTag?: string;

  constructor(props: GetLimitTypesByFilterRequest) {
    super(props);
  }
}

export type GetLimitTypesByFilterResponseDto = GetLimitTypesByFilterResponse;

export type GetLimitTypesByFilterKafkaRequest =
  KafkaMessage<GetLimitTypesByFilterRequestDto>;

export type GetLimitTypesByFilterKafkaResponse =
  KafkaResponse<GetLimitTypesByFilterResponseDto>;

/**
 * Limit type controller.
 */
@Controller()
@MicroserviceController()
export class GetLimitTypesByFilterMicroserviceController {
  /**
   * Default currency RPC controller constructor.
   */
  constructor(@InjectValidator() private validate: Validator) {}

  /**
   * Consumer of get limit types by filter.
   *
   * @param limitTypeRepository Limit type repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.LIMIT_TYPE.GET_BY_FILTER)
  async execute(
    @RepositoryParam(LimitTypeDatabaseRepository)
    limitTypeRepository: LimitTypeRepository,
    @LoggerParam(GetLimitTypesByFilterMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetLimitTypesByFilterRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetLimitTypesByFilterKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetLimitTypesByFilterRequestDto(message);
    await this.validate(payload);

    // Update user limit controller.
    const controller = new GetLimitTypesByFilterController(
      logger,
      limitTypeRepository,
    );

    const limitTypes = await controller.execute(payload);

    logger.debug('Limit types found.', { limitTypes });

    return {
      ctx,
      value: limitTypes,
    };
  }
}
