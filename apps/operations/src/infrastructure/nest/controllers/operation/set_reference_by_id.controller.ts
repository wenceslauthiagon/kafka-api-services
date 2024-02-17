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
  SetOperationReferenceByIdController,
  SetOperationReferenceByIdRequest,
  SetOperationReferenceByIdResponse,
} from '@zro/operations/interface';

export type SetOperationReferenceByIdKafkaRequest =
  KafkaMessage<SetOperationReferenceByIdRequest>;
export type SetOperationReferenceByIdKafkaResponse =
  KafkaResponse<SetOperationReferenceByIdResponse>;

@Controller()
@MicroserviceController()
export class SetOperationReferenceByIdMicroserviceController {
  /**
   * Parse set reference by id message and call
   * set reference controller.
   *
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.OPERATION.SET_REFERENCE_BY_ID)
  async execute(
    @RepositoryParam(OperationDatabaseRepository)
    operationRepository: OperationRepository,
    @LoggerParam(SetOperationReferenceByIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: SetOperationReferenceByIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<SetOperationReferenceByIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const request = new SetOperationReferenceByIdRequest(message);

    logger.info('Set reference by operation id.', { request });

    // Create set controller.
    const controller = new SetOperationReferenceByIdController(
      logger,
      operationRepository,
    );

    // set operation.
    const result = await controller.execute(request);

    logger.info('Operations updated.', { operations: result });

    return {
      ctx,
      value: result,
    };
  }
}
