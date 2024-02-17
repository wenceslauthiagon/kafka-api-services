import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { IsOptional } from 'class-validator';
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
import { SystemRepository } from '@zro/otc/domain';
import {
  GetAllSystemController,
  GetAllSystemRequest,
  GetAllSystemResponse,
  GetAllSystemRequestSort,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  SystemDatabaseRepository,
} from '@zro/otc/infrastructure';

export class GetAllSystemRequestDto
  extends PaginationRequest
  implements GetAllSystemRequest
{
  @IsOptional()
  @Sort(GetAllSystemRequestSort)
  sort?: PaginationSort;
}

export type GetAllSystemResponseDto = GetAllSystemResponse;

export type GetAllSystemKafkaRequest = KafkaMessage<GetAllSystemRequestDto>;

export type GetAllSystemKafkaResponse = KafkaResponse<GetAllSystemResponseDto>;

/**
 * System controller.
 */
@Controller()
@MicroserviceController()
export class GetAllSystemMicroserviceController {
  /**
   * Consumer of get systems.
   *
   * @param systemRepository System repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.SYSTEM.GET_ALL)
  async execute(
    @RepositoryParam(SystemDatabaseRepository)
    systemRepository: SystemRepository,
    @LoggerParam(GetAllSystemMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAllSystemRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAllSystemKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAllSystemRequestDto(message);

    // Create and call get systems controller.
    const controller = new GetAllSystemController(logger, systemRepository);

    // Get systems
    const systems = await controller.execute(payload);

    logger.debug('Systems found.', { systems });

    return {
      ctx,
      value: systems,
    };
  }
}
