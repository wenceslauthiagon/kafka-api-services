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
  KAFKA_TOPICS,
  PixDevolutionReceivedDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import {
  GetPixDevolutionReceivedByIdRequest,
  GetPixDevolutionReceivedByIdResponse,
  GetPixDevolutionReceivedByIdController,
} from '@zro/pix-payments/interface';

export type GetPixDevolutionReceivedByIdKafkaRequest =
  KafkaMessage<GetPixDevolutionReceivedByIdRequest>;

export type GetPixDevolutionReceivedByIdKafkaResponse =
  KafkaResponse<GetPixDevolutionReceivedByIdResponse>;

/**
 * Get by devolution received id controller.
 */
@Controller()
@MicroserviceController()
export class GetPixDevolutionReceivedByIdMicroserviceController {
  /**
   * Consumer of get by devolution received id.
   *
   * @param devolutionReceivedRepository PixDevolutionReceived repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.PIX_DEVOLUTION_RECEIVED.GET_BY_ID)
  async execute(
    @RepositoryParam(PixDevolutionReceivedDatabaseRepository)
    devolutionReceivedRepository: PixDevolutionReceivedRepository,
    @LoggerParam(GetPixDevolutionReceivedByIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetPixDevolutionReceivedByIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetPixDevolutionReceivedByIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetPixDevolutionReceivedByIdRequest(message);

    // Get by id pix devolution received controller.
    const controller = new GetPixDevolutionReceivedByIdController(
      logger,
      devolutionReceivedRepository,
    );

    const devolutionReceived = await controller.execute(payload);

    logger.info('Devolution received found.', { devolutionReceived });

    return {
      ctx,
      value: devolutionReceived,
    };
  }
}
