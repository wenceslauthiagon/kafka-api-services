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
} from '@zro/operations/domain';
import {
  KAFKA_TOPICS,
  OperationDatabaseRepository,
  OperationEventKafkaEmitter,
  WalletAccountDatabaseRepository,
} from '@zro/operations/infrastructure';
import {
  OperationEventEmitterControllerInterface,
  RevertOperationController,
  RevertOperationRequest,
  RevertOperationResponse,
} from '@zro/operations/interface';

export type RevertOperationKafkaRequest = KafkaMessage<RevertOperationRequest>;
export type RevertOperationKafkaResponse =
  KafkaResponse<RevertOperationResponse>;

@Controller()
@MicroserviceController()
export class RevertOperationMicroserviceController {
  /**
   * Revert an operation from a kafka request.
   *
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.OPERATION.REVERT)
  async execute(
    @RepositoryParam(WalletAccountDatabaseRepository)
    walletAccountRepository: WalletAccountRepository,
    @RepositoryParam(OperationDatabaseRepository)
    operationRepository: OperationRepository,
    @EventEmitterParam(OperationEventKafkaEmitter)
    eventEmitter: OperationEventEmitterControllerInterface,
    @LoggerParam(RevertOperationMicroserviceController) logger: Logger,
    @Payload('value') message: RevertOperationRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<RevertOperationKafkaResponse> {
    logger.debug('Received message', { value: message });

    // Parse kafka message.
    const request = new RevertOperationRequest(message);

    logger.info('Revert operation.', { request });

    // Create controller.
    const controller = new RevertOperationController(
      logger,
      operationRepository,
      walletAccountRepository,
      eventEmitter,
    );

    // Revert operation.
    const reverted = await controller.execute(request);

    logger.info('Reverted operation.', { reverted });

    return {
      ctx,
      value: reverted,
    };
  }
}
