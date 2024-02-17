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
  GetAllPixDevolutionReceivedByWalletController,
  GetAllPixDevolutionReceivedByWalletRequest,
  GetAllPixDevolutionReceivedByWalletResponse,
} from '@zro/pix-payments/interface';
import {
  KAFKA_TOPICS,
  PixDevolutionReceivedDatabaseRepository,
} from '@zro/pix-payments/infrastructure';

export type GetAllPixDevolutionReceivedByWalletKafkaRequest =
  KafkaMessage<GetAllPixDevolutionReceivedByWalletRequest>;

export type GetAllPixDevolutionReceivedByWalletKafkaResponse =
  KafkaResponse<GetAllPixDevolutionReceivedByWalletResponse>;

/**
 * Pix devolution received controller.
 */
@Controller()
@MicroserviceController()
export class GetAllPixDevolutionReceivedByWalletMicroserviceController {
  /**
   * Consumer of get all devolutions received.
   *
   * @param devolutionReceivedRepository Devolution received repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.PIX_DEVOLUTION_RECEIVED.GET_ALL_BY_WALLET)
  async execute(
    @RepositoryParam(PixDevolutionReceivedDatabaseRepository)
    devolutionReceivedRepository: PixDevolutionReceivedRepository,
    @LoggerParam(GetAllPixDevolutionReceivedByWalletMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAllPixDevolutionReceivedByWalletRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAllPixDevolutionReceivedByWalletKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAllPixDevolutionReceivedByWalletRequest(message);

    // Create and call get devolutions received controller.
    const controller = new GetAllPixDevolutionReceivedByWalletController(
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
