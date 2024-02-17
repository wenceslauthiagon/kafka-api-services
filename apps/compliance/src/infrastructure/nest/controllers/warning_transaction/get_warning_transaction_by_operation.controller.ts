import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Ctx, KafkaContext, Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { WarningTransactionRepository } from '@zro/compliance/domain';
import {
  WarningTransactionDatabaseRepository,
  KAFKA_TOPICS,
} from '@zro/compliance/infrastructure';
import {
  GetWarningTransactionByOperationController,
  GetWarningTransactionByOperationRequest,
  GetWarningTransactionByOperationResponse,
} from '@zro/compliance/interface';

export type GetWarningTransactionByOperationKafkaRequest =
  KafkaMessage<GetWarningTransactionByOperationRequest>;

export type GetWarningTransactionByOperationKafkaResponse =
  KafkaResponse<GetWarningTransactionByOperationResponse>;

/**
 * Get warning transaction by operation controller.
 */
@Controller()
@MicroserviceController()
export class GetWarningTransactionByOperationMicroserviceController {
  /**
   * Consumer of get warning transaction by operation.
   *
   * @param warningTransactionRepository Warning transaction repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.WARNING_TRANSACTION.GET_BY_OPERATION)
  async execute(
    @RepositoryParam(WarningTransactionDatabaseRepository)
    warningTransactionRepository: WarningTransactionRepository,
    @LoggerParam(GetWarningTransactionByOperationMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetWarningTransactionByOperationRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetWarningTransactionByOperationKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetWarningTransactionByOperationRequest(message);

    logger.debug('Get warning transaction by operation.', { payload });

    // Create and call get warning transaction by operation controller.
    const controller = new GetWarningTransactionByOperationController(
      logger,
      warningTransactionRepository,
    );

    // Found warning transaction
    const warningTransaction = await controller.execute(payload);

    logger.debug('Warning transaction found.', { warningTransaction });

    return {
      ctx,
      value: warningTransaction,
    };
  }
}
