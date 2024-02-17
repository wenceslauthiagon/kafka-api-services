import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  EventEmitterParam,
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  KafkaServiceParam,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { WarningTransactionRepository } from '@zro/compliance/domain';
import { PixPaymentService } from '@zro/compliance/application';
import {
  WarningTransactionDatabaseRepository,
  KAFKA_TOPICS,
  WarningTransactionEventKafkaEmitter,
  PixPaymentServiceKafka,
} from '@zro/compliance/infrastructure';
import {
  CloseWarningTransactionController,
  CloseWarningTransactionRequest,
  CloseWarningTransactionResponse,
  WarningTransactionEventEmitterControllerInterface,
} from '@zro/compliance/interface';

export type CloseWarningTransactionKafkaRequest =
  KafkaMessage<CloseWarningTransactionRequest>;

export type CloseWarningTransactionKafkaResponse =
  KafkaResponse<CloseWarningTransactionResponse>;

/**
 * Close warning transaction controller.
 */
@Controller()
@MicroserviceController()
export class CloseWarningTransactionMicroserviceController {
  /**
   * Consumer of close warning transaction.
   *
   * @param warningTransactionRepository Warning transaction repository.
   * @param eventEmitter Warning Transaction Event Emitter Controller Interface
   * @param pixPaymentService Pix Payments Service
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.WARNING_TRANSACTION.CLOSE)
  async execute(
    @RepositoryParam(WarningTransactionDatabaseRepository)
    warningTransactionRepository: WarningTransactionRepository,
    @EventEmitterParam(WarningTransactionEventKafkaEmitter)
    eventEmitter: WarningTransactionEventEmitterControllerInterface,
    @KafkaServiceParam(PixPaymentServiceKafka)
    pixPaymentService: PixPaymentService,
    @LoggerParam(CloseWarningTransactionMicroserviceController)
    logger: Logger,
    @Payload('value') message: CloseWarningTransactionRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CloseWarningTransactionKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Load and validate payload message.
    const payload = new CloseWarningTransactionRequest(message);

    logger.debug('Close warning transaction.', { payload });

    // Create and call close warning transaction controller.
    const controller = new CloseWarningTransactionController(
      logger,
      warningTransactionRepository,
      eventEmitter,
      pixPaymentService,
    );

    const warningTransaction = await controller.execute(payload);

    logger.info('Warning transaction closed.', { warningTransaction });

    return {
      ctx,
      value: warningTransaction,
    };
  }
}
