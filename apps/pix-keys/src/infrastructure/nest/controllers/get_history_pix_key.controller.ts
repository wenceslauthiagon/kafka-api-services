import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { Logger } from 'winston';
import { IsUUID, IsOptional, IsObject } from 'class-validator';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
  PaginationRequest,
  Sort,
  PaginationSort,
} from '@zro/common';
import {
  KeyState,
  PixKeyHistoryRepository,
  GetDateFilter,
  GetPixKeyFilter,
} from '@zro/pix-keys/domain';
import {
  KAFKA_TOPICS,
  PixKeyHistoryDatabaseRepository,
} from '@zro/pix-keys/infrastructure';
import {
  GetHistoryPixKeyRequest,
  GetHistoryPixKeyResponse,
  GetHistoryPixKeyController,
  GetHistoryPixKeyRequestSort,
} from '@zro/pix-keys/interface';

export class GetHistoryPixKeyRequestDto
  extends PaginationRequest
  implements GetHistoryPixKeyRequest
{
  @IsOptional()
  @Sort(GetHistoryPixKeyRequestSort)
  sort?: PaginationSort;

  @IsOptional()
  @IsUUID(4)
  pixKeyId?: string;

  @IsOptional()
  @IsObject()
  pixKey?: GetPixKeyFilter;

  @IsOptional()
  state?: KeyState;

  @IsOptional()
  @IsObject()
  createdAt?: GetDateFilter;

  @IsOptional()
  @IsObject()
  updatedAt?: GetDateFilter;
}

export type GetHistoryPixKeyResponseDto = GetHistoryPixKeyResponse;

export type GetHistoryPixKeyKafkaRequest =
  KafkaMessage<GetHistoryPixKeyRequestDto>;

export type GetHistoryPixKeyKafkaResponse =
  KafkaResponse<GetHistoryPixKeyResponseDto>;

/**
 * GetHistoryPixKeyMicroserviceController controller.
 */
@Controller()
@MicroserviceController()
export class GetHistoryPixKeyMicroserviceController {
  /**
   * Consumer of history pix key.
   *
   * @param pixKeyHistoryRepository Pix key history repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.KEY_HISTORY.GET_ALL)
  async execute(
    @RepositoryParam(PixKeyHistoryDatabaseRepository)
    pixKeyHistoryRepository: PixKeyHistoryRepository,
    @LoggerParam(GetHistoryPixKeyMicroserviceController) logger: Logger,
    @Payload('value') message: GetHistoryPixKeyRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetHistoryPixKeyKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetHistoryPixKeyRequestDto(message);

    logger.info('Getting history pix key.', { payload });

    // Create and call get history pix key controller.
    const controller = new GetHistoryPixKeyController(
      logger,
      pixKeyHistoryRepository,
    );

    // Get pixKey
    const pixHistoryKey = await controller.execute(payload);

    logger.info('Pix history key found.', { pixHistoryKey });

    return {
      ctx,
      value: pixHistoryKey,
    };
  }
}
