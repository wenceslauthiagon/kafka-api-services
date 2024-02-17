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
import {
  KAFKA_TOPICS,
  TransactionTypeDatabaseRepository,
} from '@zro/operations/infrastructure';
import {
  GetActiveTransactionTypeByTagController,
  GetActiveTransactionTypeByTagRequest,
  GetActiveTransactionTypeByTagResponse,
} from '@zro/operations/interface';
import { TransactionTypeRepository } from '@zro/operations/domain';

export type GetActiveTransactionTypeByTagKafkaRequest =
  KafkaMessage<GetActiveTransactionTypeByTagRequest>;

export type GetActiveTransactionTypeByTagKafkaResponse =
  KafkaResponse<GetActiveTransactionTypeByTagResponse>;

/**
 * Transaction type controller.
 */
@Controller()
@MicroserviceController()
export class GetActiveTransactionTypeByTagMicroserviceController {
  /**
   * Consumer of get active transaction type by tag.
   *
   * @param transactionTypeRepository Transaction type repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.TRANSACTION_TYPE.GET_ACTIVE_BY_TAG)
  async execute(
    @RepositoryParam(TransactionTypeDatabaseRepository)
    transactionTypeRepository: TransactionTypeRepository,
    @LoggerParam(GetActiveTransactionTypeByTagMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetActiveTransactionTypeByTagRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetActiveTransactionTypeByTagKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetActiveTransactionTypeByTagRequest(message);

    const controller = new GetActiveTransactionTypeByTagController(
      logger,
      transactionTypeRepository,
    );

    const transactionType = await controller.execute(payload);

    logger.info('Transaction type found.', { transactionType });

    return {
      ctx,
      value: transactionType,
    };
  }
}
