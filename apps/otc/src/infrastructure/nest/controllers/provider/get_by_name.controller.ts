import { Logger } from 'winston';
import { IsString, MaxLength } from 'class-validator';
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
} from '@zro/common';
import { ProviderRepository } from '@zro/otc/domain';
import {
  GetByNameProviderController,
  GetByNameProviderRequest,
  GetByNameProviderResponse,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  ProviderDatabaseRepository,
} from '@zro/otc/infrastructure';

export class GetByNameProviderRequestDto implements GetByNameProviderRequest {
  @IsString()
  @MaxLength(255)
  name: string;

  constructor(props: GetByNameProviderRequest) {
    Object.assign(this, props);
  }
}

export type GetByNameProviderResponseDto = GetByNameProviderResponse;

export type GetByNameProviderKafkaRequest =
  KafkaMessage<GetByNameProviderRequestDto>;

export type GetByNameProviderKafkaResponse =
  KafkaResponse<GetByNameProviderResponseDto>;

/**
 * Provider controller.
 */
@Controller()
@MicroserviceController()
export class GetByNameProviderMicroserviceController {
  /**
   * Default provider RPC controller constructor.
   */
  constructor(@InjectValidator() private validate: Validator) {}

  /**
   * Consumer of get by provider name.
   *
   * @param providerRepository Provider repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.PROVIDER.GET_BY_NAME)
  async execute(
    @RepositoryParam(ProviderDatabaseRepository)
    providerRepository: ProviderRepository,
    @LoggerParam(GetByNameProviderMicroserviceController) logger: Logger,
    @Payload('value') message: GetByNameProviderRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetByNameProviderKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetByNameProviderRequestDto(message);
    await this.validate(payload);

    // Create and call get provider by name controller.
    const controller = new GetByNameProviderController(
      logger,
      providerRepository,
    );

    const provider = await controller.execute(payload);

    logger.info('Provider found.', { provider });

    return {
      ctx,
      value: provider,
    };
  }
}
