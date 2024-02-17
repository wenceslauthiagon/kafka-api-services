import { Logger } from 'winston';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';

import {
  KafkaMessage,
  KafkaResponse,
  InjectValidator,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
  Validator,
  KafkaMessagePattern,
} from '@zro/common';
import { ProviderRepository } from '@zro/otc/domain';
import {
  CreateProviderController,
  CreateProviderRequest,
  CreateProviderResponse,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  ProviderDatabaseRepository,
} from '@zro/otc/infrastructure';

export class CreateProviderRequestDto implements CreateProviderRequest {
  @IsUUID(4)
  id: string;

  @IsString()
  @MaxLength(80)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(140)
  description?: string;

  constructor(props: CreateProviderRequest) {
    Object.assign(this, props);
  }
}

export type CreateProviderResponseDto = CreateProviderResponse;

export type CreateProviderKafkaRequest = KafkaMessage<CreateProviderRequestDto>;

export type CreateProviderKafkaResponse =
  KafkaResponse<CreateProviderResponseDto>;

/**
 * Provider controller.
 */
@Controller()
@MicroserviceController()
export class CreateProviderMicroserviceController {
  /**
   * Default provider RPC controller constructor.
   */
  constructor(@InjectValidator() private validate: Validator) {}

  /**
   * Consumer of create provider.
   *
   * @param providerRepository Provider repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.PROVIDER.CREATE)
  async execute(
    @RepositoryParam(ProviderDatabaseRepository)
    providerRepository: ProviderRepository,
    @LoggerParam(CreateProviderMicroserviceController) logger: Logger,
    @Payload('value') message: CreateProviderRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateProviderKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CreateProviderRequestDto(message);
    await this.validate(payload);

    // Create and call create provider controller.
    const controller = new CreateProviderController(logger, providerRepository);

    const provider = await controller.execute(payload);

    logger.info('Provider created.', { provider });

    return {
      ctx,
      value: provider,
    };
  }
}
