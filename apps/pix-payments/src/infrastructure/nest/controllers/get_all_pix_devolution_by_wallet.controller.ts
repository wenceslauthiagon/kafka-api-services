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
  GetAllPixDevolutionByWalletController,
  GetAllPixDevolutionByWalletRequest,
  GetAllPixDevolutionByWalletResponse,
} from '@zro/pix-payments/interface';
import {
  KAFKA_TOPICS,
  PixDevolutionDatabaseRepository,
} from '@zro/pix-payments/infrastructure';

export type GetAllPixDevolutionByWalletKafkaRequest =
  KafkaMessage<GetAllPixDevolutionByWalletRequest>;

export type GetAllPixDevolutionByWalletKafkaResponse =
  KafkaResponse<GetAllPixDevolutionByWalletResponse>;

/**
 * Payment controller.
 */
@Controller()
@MicroserviceController()
export class GetAllPixDevolutionByWalletMicroserviceController {
  /**
   * Consumer of get devolutions.
   *
   * @param devolutionRepository Devolution repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.PIX_DEVOLUTION.GET_ALL_BY_WALLET)
  async execute(
    @RepositoryParam(PixDevolutionDatabaseRepository)
    devolutionRepository: PixDevolutionRepository,
    @LoggerParam(GetAllPixDevolutionByWalletMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAllPixDevolutionByWalletRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAllPixDevolutionByWalletKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAllPixDevolutionByWalletRequest(message);

    // Create and call get devolutions controller.
    const controller = new GetAllPixDevolutionByWalletController(
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
