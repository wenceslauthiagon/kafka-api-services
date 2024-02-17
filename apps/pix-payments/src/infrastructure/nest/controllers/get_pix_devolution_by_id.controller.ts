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
import { PixDevolutionRepository } from '@zro/pix-payments/domain';
import {
  KAFKA_TOPICS,
  PixDevolutionDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import {
  GetPixDevolutionByIdRequest,
  GetPixDevolutionByIdResponse,
  GetByPixDevolutionIdController,
} from '@zro/pix-payments/interface';

export type GetPixDevolutionByIdKafkaRequest =
  KafkaMessage<GetPixDevolutionByIdRequest>;

export type GetPixDevolutionByIdKafkaResponse =
  KafkaResponse<GetPixDevolutionByIdResponse>;

/**
 * Get by devolution id controller.
 */
@Controller()
@MicroserviceController()
export class GetPixDevolutionByIdMicroserviceController {
  /**
   * Consumer of get by devolution id.
   *
   * @param devolutionRepository PixDevolution repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.PIX_DEVOLUTION.GET_BY_ID)
  async execute(
    @RepositoryParam(PixDevolutionDatabaseRepository)
    devolutionRepository: PixDevolutionRepository,
    @LoggerParam(GetPixDevolutionByIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetPixDevolutionByIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetPixDevolutionByIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetPixDevolutionByIdRequest(message);

    logger.info('Get by devolution id from user.', { payload });

    // Get by id pix devolution controller.
    const controller = new GetByPixDevolutionIdController(
      logger,
      devolutionRepository,
    );

    const devolution = await controller.execute(payload);

    logger.info('Devolution found.', { devolution });

    return {
      ctx,
      value: devolution,
    };
  }
}
