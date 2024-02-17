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
import { PixInfractionRepository } from '@zro/pix-payments/domain';
import {
  KAFKA_TOPICS,
  PixInfractionDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import {
  GetPixInfractionByPspIdRequest,
  GetPixInfractionByPspIdResponse,
  GetPixInfractionByPspIdController,
} from '@zro/pix-payments/interface';

export type GetPixInfractionByPspIdKafkaRequest =
  KafkaMessage<GetPixInfractionByPspIdRequest>;

export type GetPixInfractionByPspIdKafkaResponse =
  KafkaResponse<GetPixInfractionByPspIdResponse>;

/**
 * Get by id psp infraction controller.
 */
@Controller()
@MicroserviceController()
export class GetPixInfractionByPspIdMicroserviceController {
  /**
   * Consumer of get infraction by psp id.
   *
   * @param infractionRepository Infraction repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.PIX_INFRACTION.GET_BY_PSP_ID)
  async execute(
    @RepositoryParam(PixInfractionDatabaseRepository)
    infractionRepository: PixInfractionRepository,
    @LoggerParam(GetPixInfractionByPspIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetPixInfractionByPspIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetPixInfractionByPspIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetPixInfractionByPspIdRequest(message);

    logger.info('Get by id psp infraction.', { payload });

    // Get by id psp infraction controller.
    const controller = new GetPixInfractionByPspIdController(
      logger,
      infractionRepository,
    );

    const infraction = await controller.execute(payload);

    logger.info('Infraction found.', { infraction });

    return {
      ctx,
      value: infraction,
    };
  }
}
