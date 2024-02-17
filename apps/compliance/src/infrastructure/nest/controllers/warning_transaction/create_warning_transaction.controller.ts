import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  EventEmitterParam,
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
  WarningTransactionEventKafkaEmitter,
} from '@zro/compliance/infrastructure';
import {
  CreateWarningTransactionController,
  CreateWarningTransactionRequest,
  CreateWarningTransactionResponse,
  WarningTransactionEventEmitterControllerInterface,
} from '@zro/compliance/interface';

export type CreateWarningTransactionKafkaRequest =
  KafkaMessage<CreateWarningTransactionRequest>;

export type CreateWarningTransactionKafkaResponse =
  KafkaResponse<CreateWarningTransactionResponse>;

/**
 * Create warning transaction controller.
 */
@Controller()
@MicroserviceController()
export class CreateWarningTransactionMicroserviceController {
  /**
   * Consumer of create warning transaction.
   *
   * @param warningTransactionRepository Warning transaction repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.WARNING_TRANSACTION.CREATE)
  async execute(
    @RepositoryParam(WarningTransactionDatabaseRepository)
    warningTransactionRepository: WarningTransactionRepository,
    @EventEmitterParam(WarningTransactionEventKafkaEmitter)
    warningTransactionEventEmitter: WarningTransactionEventEmitterControllerInterface,
    @LoggerParam(CreateWarningTransactionMicroserviceController)
    logger: Logger,
    @Payload('value') message: CreateWarningTransactionRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateWarningTransactionKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CreateWarningTransactionRequest(message);

    logger.debug('Create warning transaction.', { payload });

    // Create and call create warning transaction controller.
    const controller = new CreateWarningTransactionController(
      logger,
      warningTransactionRepository,
      warningTransactionEventEmitter,
    );

    // Created warning transaction
    const warningTransaction = await controller.execute(payload);

    logger.debug('Warning transaction created.', { warningTransaction });

    return {
      ctx,
      value: warningTransaction,
    };
  }
}
