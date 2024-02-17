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
import {
  OperationRepository,
  WalletAccountRepository,
  WalletAccountTransactionRepository,
} from '@zro/operations/domain';
import {
  KAFKA_TOPICS,
  OperationDatabaseRepository,
  OperationEventKafkaEmitter,
  WalletAccountDatabaseRepository,
  WalletAccountTransactionDatabaseRepository,
} from '@zro/operations/infrastructure';
import {
  AcceptOperationController,
  AcceptOperationRequest,
  AcceptOperationResponse,
  OperationEventEmitterControllerInterface,
} from '@zro/operations/interface';

export type AcceptOperationKafkaRequest = KafkaMessage<AcceptOperationRequest>;

export type AcceptOperationKafkaResponse =
  KafkaResponse<AcceptOperationResponse>;

@Controller()
@MicroserviceController()
export class AcceptOperationMicroserviceController {
  /**
   * Accept an operation from a kafka request.
   *
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.OPERATION.ACCEPT)
  async execute(
    @RepositoryParam(WalletAccountTransactionDatabaseRepository)
    walletAccountTransactionRepository: WalletAccountTransactionRepository,
    @RepositoryParam(WalletAccountDatabaseRepository)
    walletAccountRepository: WalletAccountRepository,
    @RepositoryParam(OperationDatabaseRepository)
    operationRepository: OperationRepository,
    @EventEmitterParam(OperationEventKafkaEmitter)
    eventEmitter: OperationEventEmitterControllerInterface,
    @LoggerParam(AcceptOperationMicroserviceController) logger: Logger,
    @Payload('value') message: AcceptOperationRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<AcceptOperationKafkaResponse> {
    logger.debug('Received message', { value: message });

    // Parse kafka message.
    const request = new AcceptOperationRequest(message);

    logger.info('Accept operation.', { request });

    // Create controller.
    const controller = new AcceptOperationController(
      logger,
      operationRepository,
      walletAccountRepository,
      walletAccountTransactionRepository,
      eventEmitter,
    );

    // Accept operation.
    const accepted = await controller.execute(request);

    logger.info('Accepted operation.', { accepted });

    return {
      ctx,
      value: accepted,
    };
  }
}
