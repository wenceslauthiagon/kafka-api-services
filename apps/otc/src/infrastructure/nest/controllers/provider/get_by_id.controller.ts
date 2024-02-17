import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';

import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { ProviderRepository } from '@zro/otc/domain';
import {
  GetProviderByIdController,
  GetProviderByIdRequest,
  GetProviderByIdResponse,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  ProviderDatabaseRepository,
} from '@zro/otc/infrastructure';

export type GetProviderByIdKafkaRequest = KafkaMessage<GetProviderByIdRequest>;

export type GetProviderByIdKafkaResponse =
  KafkaResponse<GetProviderByIdResponse>;

/**
 * Provider controller.
 */
@Controller()
@MicroserviceController()
export class GetByIdProviderMicroserviceController {
  /**
   * Consumer of get by provider id.
   *
   * @param providerRepository Provider repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.PROVIDER.GET_BY_ID)
  async execute(
    @RepositoryParam(ProviderDatabaseRepository)
    providerRepository: ProviderRepository,
    @LoggerParam(GetByIdProviderMicroserviceController) logger: Logger,
    @Payload('value') message: GetProviderByIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetProviderByIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetProviderByIdRequest(message);

    // Create and call get provider by id controller.
    const controller = new GetProviderByIdController(
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
