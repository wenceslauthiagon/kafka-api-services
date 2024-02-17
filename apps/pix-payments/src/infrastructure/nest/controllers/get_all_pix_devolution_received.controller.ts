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
import { PixDevolutionReceivedRepository } from '@zro/pix-payments/domain';
import {
  GetAllPixDevolutionReceivedController,
  GetAllPixDevolutionReceivedRequest,
  GetAllPixDevolutionReceivedResponse,
} from '@zro/pix-payments/interface';
import {
  KAFKA_TOPICS,
  PixDevolutionReceivedDatabaseRepository,
} from '@zro/pix-payments/infrastructure';

export type GetAllPixDevolutionReceivedKafkaRequest =
  KafkaMessage<GetAllPixDevolutionReceivedRequest>;

export type GetAllPixDevolutionReceivedKafkaResponse =
  KafkaResponse<GetAllPixDevolutionReceivedResponse>;

/**
 * Pix devolution received controller.
 */
@Controller()
@MicroserviceController()
export class GetAllPixDevolutionReceivedMicroserviceController {
  /**
   * Consumer of get all devolutions received.
   *
   * @param devolutionReceivedRepository Devolution received repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.PIX_DEVOLUTION_RECEIVED.GET_ALL)
  async execute(
    @RepositoryParam(PixDevolutionReceivedDatabaseRepository)
    devolutionReceivedRepository: PixDevolutionReceivedRepository,
    @LoggerParam(GetAllPixDevolutionReceivedMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAllPixDevolutionReceivedRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAllPixDevolutionReceivedKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAllPixDevolutionReceivedRequest(message);

    // Create and call get devolutions received controller.
    const controller = new GetAllPixDevolutionReceivedController(
      logger,
      devolutionReceivedRepository,
    );

    // Get devolutions received
    const devolutionsReceived = await controller.execute(payload);

    logger.info('Devolutions received found.', { devolutionsReceived });

    return {
      ctx,
      value: devolutionsReceived,
    };
  }
}
