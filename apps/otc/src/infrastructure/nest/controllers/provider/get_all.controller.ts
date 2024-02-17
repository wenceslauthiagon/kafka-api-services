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
import { ProviderRepository } from '@zro/otc/domain';
import {
  GetAllProviderController,
  GetAllProviderRequest,
  GetAllProviderRequestSort,
  GetAllProviderResponse,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  ProviderDatabaseRepository,
} from '@zro/otc/infrastructure';

export class GetAllProviderRequestDto
  extends PaginationRequest
  implements GetAllProviderRequest
{
  @IsOptional()
  @Sort(GetAllProviderRequestSort)
  sort?: PaginationSort;
}

export type GetAllProviderResponseDto = GetAllProviderResponse;

export type GetAllProviderKafkaRequest = KafkaMessage<GetAllProviderRequestDto>;

export type GetAllProviderKafkaResponse =
  KafkaResponse<GetAllProviderResponseDto>;

/**
 * Provider controller.
 */
@Controller()
@MicroserviceController()
export class GetAllProviderMicroserviceController {
  /**
   * Consumer of get providers.
   *
   * @param providerRepository Provider repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.PROVIDER.GET_ALL)
  async execute(
    @RepositoryParam(ProviderDatabaseRepository)
    providerRepository: ProviderRepository,
    @LoggerParam(GetAllProviderMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAllProviderRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAllProviderKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAllProviderRequestDto(message);

    // Create and call get providers controller.
    const controller = new GetAllProviderController(logger, providerRepository);

    // Get providers
    const providers = await controller.execute(payload);

    logger.info('Providers found.', { providers });

    return {
      ctx,
      value: providers,
    };
  }
}
