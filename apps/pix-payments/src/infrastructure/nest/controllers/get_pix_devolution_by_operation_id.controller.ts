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
import {
  PixDepositRepository,
  PixDevolutionRepository,
} from '@zro/pix-payments/domain';
import {
  KAFKA_TOPICS,
  PixDevolutionDatabaseRepository,
  PixDepositDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import {
  GetPixDevolutionByOperationIdController,
  GetPixDevolutionByOperationIdRequest,
  GetPixDevolutionByOperationIdResponse,
} from '@zro/pix-payments/interface';

export type GetPixDevolutionByOperationIdKafkaRequest =
  KafkaMessage<GetPixDevolutionByOperationIdRequest>;

export type GetPixDevolutionByOperationIdKafkaResponse =
  KafkaResponse<GetPixDevolutionByOperationIdResponse>;

/**
 * Get devolution by operation id controller.
 */
@Controller()
@MicroserviceController()
export class GetPixDevolutionByOperationIdMicroserviceController {
  /**
   * Consumer of GetPixDevolutionByOperationId.
   *
   * @param devolutionRepository Devolution repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.PIX_DEVOLUTION.GET_BY_OPERATION_ID)
  async execute(
    @RepositoryParam(PixDevolutionDatabaseRepository)
    devolutionRepository: PixDevolutionRepository,
    @RepositoryParam(PixDepositDatabaseRepository)
    depositRepository: PixDepositRepository,
    @LoggerParam(GetPixDevolutionByOperationIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetPixDevolutionByOperationIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetPixDevolutionByOperationIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetPixDevolutionByOperationIdRequest(message);

    logger.info('Get devolution by operation id from user.', {
      userId: payload.userId,
    });

    // Get GetPixDevolutionByOperationId controller.
    const controller = new GetPixDevolutionByOperationIdController(
      logger,
      devolutionRepository,
      depositRepository,
    );

    const devolution = await controller.execute(payload);

    logger.info('PixDevolution response.', { devolution });

    return {
      ctx,
      value: devolution,
    };
  }
}
