import { IsOptional, IsUUID } from 'class-validator';
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
  PaginationRequest,
  Sort,
  PaginationSort,
} from '@zro/common';
import { PixKeyRepository } from '@zro/pix-keys/domain';
import {
  GetAllPixKeyController,
  GetAllPixKeyRequest,
  GetAllPixKeyRequestSort,
  GetAllPixKeyResponse,
} from '@zro/pix-keys/interface';
import {
  KAFKA_TOPICS,
  PixKeyDatabaseRepository,
} from '@zro/pix-keys/infrastructure';

export class GetAllPixKeyRequestDto
  extends PaginationRequest
  implements GetAllPixKeyRequest
{
  @IsUUID(4)
  @IsOptional()
  userId?: string;

  @IsOptional()
  @Sort(GetAllPixKeyRequestSort)
  sort?: PaginationSort;
}

export type GetAllPixKeyResponseDto = GetAllPixKeyResponse;

export type GetAllPixKeyKafkaRequest = KafkaMessage<GetAllPixKeyRequestDto>;

export type GetAllPixKeyKafkaResponse = KafkaResponse<GetAllPixKeyResponseDto>;

/**
 * PixKey controller.
 */
@Controller()
@MicroserviceController()
export class GetAllPixKeyMicroserviceController {
  /**
   * Consumer of get all pixKeys.
   *
   * @param pixKeyRepository Pix key repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.KEY.GET_ALL)
  async execute(
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @LoggerParam(GetAllPixKeyMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAllPixKeyRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAllPixKeyKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAllPixKeyRequestDto(message);

    // Create and call get pixKeys by user controller.
    const controller = new GetAllPixKeyController(logger, pixKeyRepository);

    // Get pixKeys
    const pixKeys = await controller.execute(payload);

    logger.info('Pix keys found.', { pixKeys });

    return {
      ctx,
      value: pixKeys,
    };
  }
}
