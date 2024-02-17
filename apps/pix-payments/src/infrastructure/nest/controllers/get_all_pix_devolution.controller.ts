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
  GetAllPixDevolutionController,
  GetAllPixDevolutionRequest,
  GetAllPixDevolutionResponse,
} from '@zro/pix-payments/interface';
import {
  KAFKA_TOPICS,
  PixDevolutionDatabaseRepository,
} from '@zro/pix-payments/infrastructure';

export type GetAllPixDevolutionKafkaRequest =
  KafkaMessage<GetAllPixDevolutionRequest>;

export type GetAllPixDevolutionKafkaResponse =
  KafkaResponse<GetAllPixDevolutionResponse>;

/**
 * Payment controller.
 */
@Controller()
@MicroserviceController()
export class GetAllPixDevolutionMicroserviceController {
  /**
   * Consumer of get devolutions.
   *
   * @param devolutionRepository Devolution repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.PIX_DEVOLUTION.GET_ALL)
  async execute(
    @RepositoryParam(PixDevolutionDatabaseRepository)
    devolutionRepository: PixDevolutionRepository,
    @LoggerParam(GetAllPixDevolutionMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAllPixDevolutionRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAllPixDevolutionKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAllPixDevolutionRequest(message);

    // Create and call get devolutions controller.
    const controller = new GetAllPixDevolutionController(
      logger,
      devolutionRepository,
    );

    // Get devolutions
    const devolutions = await controller.execute(payload);

    logger.info('Devolutions found.', { devolutions });

    return {
      ctx,
      value: devolutions,
    };
  }
}
