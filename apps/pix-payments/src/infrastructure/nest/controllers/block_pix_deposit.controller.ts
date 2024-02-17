import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  RepositoryParam,
  EventEmitterParam,
  KafkaServiceParam,
  MicroserviceController,
} from '@zro/common';
import {
  PixDepositRepository,
  WarningPixDepositRepository,
} from '@zro/pix-payments/domain';
import {
  KAFKA_TOPICS,
  PixDepositDatabaseRepository,
  PixDepositEventKafkaEmitter,
  OperationServiceKafka,
  WarningPixDepositDatabaseRepository,
  WarningPixDevolutionEventKafkaEmitter,
} from '@zro/pix-payments/infrastructure';
import {
  BlockPixDepositController,
  BlockPixDepositRequest,
  BlockPixDepositResponse,
  PixDepositEventEmitterControllerInterface,
  WarningPixDevolutionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type BlockPixDepositKafkaRequest = KafkaMessage<BlockPixDepositRequest>;

export type BlockPixDepositKafkaResponse =
  KafkaResponse<BlockPixDepositResponse>;

/**
 * Block pix deposit controller
 */
@Controller()
@MicroserviceController()
export class BlockPixDepositMicroserviceController {
  /**
   * Consumer of block pix deposit.
   *
   * @param logger Local logger instance.
   * @param depositRepository Deposit repository
   * @param warningPixDepositRepository Warnign Pix Deposit Repository
   * @param operationService Operation Service
   * @param pixDepositEventEmitter Pix Deposit Event Emitter Controller Interface
   * @param warningPixDevolutionEventEmitter Warning Pix Devolution Event Emitter Controller Interface
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.PIX_DEPOSIT.BLOCK)
  async execute(
    @LoggerParam(BlockPixDepositMicroserviceController)
    logger: Logger,
    @RepositoryParam(PixDepositDatabaseRepository)
    depositRepository: PixDepositRepository,
    @RepositoryParam(WarningPixDepositDatabaseRepository)
    warningPixDepositRepository: WarningPixDepositRepository,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @EventEmitterParam(PixDepositEventKafkaEmitter)
    pixDepositEventEmitter: PixDepositEventEmitterControllerInterface,
    @EventEmitterParam(WarningPixDevolutionEventKafkaEmitter)
    warningPixDevolutionEventEmitter: WarningPixDevolutionEventEmitterControllerInterface,
    @Payload('value') message: BlockPixDepositRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<BlockPixDepositKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new BlockPixDepositRequest(message);

    logger.debug('Block pix deposit.', { payload });

    // Create and call block pix deposit controller
    const controller = new BlockPixDepositController(
      logger,
      depositRepository,
      warningPixDepositRepository,
      operationService,
      pixDepositEventEmitter,
      warningPixDevolutionEventEmitter,
    );

    const pixDeposit = await controller.execute(payload);

    logger.info('Pix deposit blocked.', { pixDeposit });

    return {
      ctx,
      value: pixDeposit,
    };
  }
}
