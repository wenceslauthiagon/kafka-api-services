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
import { OperationRepository } from '@zro/operations/domain';
import {
  KAFKA_TOPICS,
  OperationDatabaseRepository,
} from '@zro/operations/infrastructure';
import {
  GetOperationByIdController,
  GetOperationByIdRequest,
  GetOperationByIdResponse,
} from '@zro/operations/interface';

export type GetOperationByIdKafkaRequest =
  KafkaMessage<GetOperationByIdRequest>;
export type GetOperationByIdKafkaResponse =
  KafkaResponse<GetOperationByIdResponse>;

@Controller()
@MicroserviceController()
export class GetOperationByIdMicroserviceController {
  /**
   * Parse get operation by id message and call
   * get operation controller.
   *
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.OPERATION.GET_BY_ID)
  async execute(
    @RepositoryParam(OperationDatabaseRepository)
    operationRepository: OperationRepository,
    @LoggerParam(GetOperationByIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetOperationByIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetOperationByIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const request = new GetOperationByIdRequest(message);

    logger.info('Get operation by id.', { request });

    // Create get controller.
    const controller = new GetOperationByIdController(
      logger,
      operationRepository,
    );

    // Get operation.
    const operation = await controller.execute(request);

    logger.info('Operation found.', { operation });

    return {
      ctx,
      value: operation,
    };
  }
}
