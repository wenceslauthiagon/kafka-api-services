import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Ctx, KafkaContext, Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  EventEmitterParam,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
  KafkaResponse,
} from '@zro/common';
import {
  PixDepositRepository,
  WarningPixDepositRepository,
  WarningPixDevolutionRepository,
} from '@zro/pix-payments/domain';
import {
  CreateWarningPixDevolutionController,
  CreateWarningPixDevolutionRequest,
  CreateWarningPixDevolutionResponse,
  PixDepositEventEmitterControllerInterface,
  WarningPixDevolutionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import {
  KAFKA_TOPICS,
  PixDepositDatabaseRepository,
  WarningPixDepositDatabaseRepository,
  WarningPixDevolutionDatabaseRepository,
  PixDepositEventKafkaEmitter,
  WarningPixDevolutionEventKafkaEmitter,
} from '@zro/pix-payments/infrastructure';

export type CreateWarningPixDevolutionKafkaRequest =
  KafkaMessage<CreateWarningPixDevolutionRequest>;

export type CreateWarningPixDevolutionKafkaResponse =
  KafkaResponse<CreateWarningPixDevolutionResponse>;

/**
 * CreateWarningPixDevolution controller.
 */
@Controller()
@MicroserviceController()
export class CreateWarningPixDevolutionMicroserviceController {
  /**
   * Consumer of create warning pix devolution.
   *
   * @param pixDepositRepository PixDeposit repository.
   * @param warningPixDepositRepository WarningPixDeposit repository.
   * @param warningPixDevolutionRepository WarningPixDevolution repository.
   * @param pixDepositEventEmitter pix deposit event emitter.
   * @param warningPixDevolutionEventEmitter Warning pix devolution event emitter.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.WARNING_PIX_DEVOLUTION.CREATE)
  async execute(
    @RepositoryParam(PixDepositDatabaseRepository)
    pixDepositRepository: PixDepositRepository,
    @RepositoryParam(WarningPixDepositDatabaseRepository)
    warningPixDepositRepository: WarningPixDepositRepository,
    @RepositoryParam(WarningPixDevolutionDatabaseRepository)
    warningPixDevolutionRepository: WarningPixDevolutionRepository,
    @EventEmitterParam(PixDepositEventKafkaEmitter)
    pixDepositEventEmitter: PixDepositEventEmitterControllerInterface,
    @EventEmitterParam(WarningPixDevolutionEventKafkaEmitter)
    warningPixDevolutionEventEmitter: WarningPixDevolutionEventEmitterControllerInterface,
    @LoggerParam(CreateWarningPixDevolutionMicroserviceController)
    logger: Logger,
    @Payload('value') message: CreateWarningPixDevolutionRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateWarningPixDevolutionKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CreateWarningPixDevolutionRequest(message);

    logger.info('Create warning pix devolution.', { payload });

    // Create and call decode account by user and key controller.
    const controller = new CreateWarningPixDevolutionController(
      logger,
      pixDepositRepository,
      warningPixDepositRepository,
      warningPixDevolutionRepository,
      pixDepositEventEmitter,
      warningPixDevolutionEventEmitter,
    );

    // Create a warning pix devolution.
    const warningPixDevolution = await controller.execute(payload);

    logger.info('Created warning pix devolution.', { warningPixDevolution });

    return {
      ctx,
      value: warningPixDevolution,
    };
  }
}
