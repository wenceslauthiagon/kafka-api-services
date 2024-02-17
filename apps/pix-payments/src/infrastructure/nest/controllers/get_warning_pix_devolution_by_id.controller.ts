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
import { WarningPixDevolutionRepository } from '@zro/pix-payments/domain';
import {
  KAFKA_TOPICS,
  WarningPixDevolutionDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import {
  GetWarningPixDevolutionByIdRequest,
  GetWarningPixDevolutionByIdResponse,
  GetWarningPixDevolutionIdController,
} from '@zro/pix-payments/interface';

export type GetWarningPixDevolutionByIdKafkaRequest =
  KafkaMessage<GetWarningPixDevolutionByIdRequest>;

export type GetWarningixDevolutionByIdKafkaResponse =
  KafkaResponse<GetWarningPixDevolutionByIdResponse>;

/**
 * Get warning by devolution id controller.
 */
@Controller()
@MicroserviceController()
export class GetByWarningPixDevolutionMicroserviceIdRestController {
  /**
   * Consumer of get warning devolution by id.
   *
   * @param warningDevolutionRepository WarningPixDevolution repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.WARNING_PIX_DEVOLUTION.GET_BY_ID)
  async execute(
    @RepositoryParam(WarningPixDevolutionDatabaseRepository)
    warningDevolutionRepository: WarningPixDevolutionRepository,
    @LoggerParam(GetByWarningPixDevolutionMicroserviceIdRestController)
    logger: Logger,
    @Payload('value') message: GetWarningPixDevolutionByIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetWarningixDevolutionByIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetWarningPixDevolutionByIdRequest(message);

    logger.info('Get by warning devolution id from user.', { payload });

    // Get by warning id pix devolution controller.
    const controller = new GetWarningPixDevolutionIdController(
      logger,
      warningDevolutionRepository,
    );

    const warningDevolution = await controller.execute(payload);

    logger.info('Warning devolution found.', { warningDevolution });

    return {
      ctx,
      value: warningDevolution,
    };
  }
}
