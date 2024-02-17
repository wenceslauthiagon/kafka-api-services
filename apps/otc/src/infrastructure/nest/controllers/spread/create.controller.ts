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
  KafkaServiceParam,
  EventEmitterParam,
} from '@zro/common';
import { SpreadRepository } from '@zro/otc/domain';
import {
  CreateSpreadController,
  CreateSpreadRequest,
  CreateSpreadResponse,
  SpreadEventEmitterControllerInterface,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  OperationServiceKafka,
  SpreadDatabaseRepository,
  SpreadEventKafkaEmitter,
} from '@zro/otc/infrastructure';

export type CreateSpreadKafkaRequest = KafkaMessage<CreateSpreadRequest>;

export type CreateSpreadKafkaResponse = KafkaResponse<CreateSpreadResponse[]>;

/**
 * Spread controller.
 */
@Controller()
@MicroserviceController()
export class CreateSpreadMicroserviceController {
  /**
   * Consumer of create spread.
   *
   * @param spreadRepository Spread repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.SPREAD.CREATE)
  async execute(
    @RepositoryParam(SpreadDatabaseRepository)
    spreadRepository: SpreadRepository,
    @EventEmitterParam(SpreadEventKafkaEmitter)
    eventEmitter: SpreadEventEmitterControllerInterface,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @LoggerParam(CreateSpreadMicroserviceController)
    logger: Logger,
    @Payload('value') message: CreateSpreadRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateSpreadKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CreateSpreadRequest(message);

    // Create and call create spread controller.
    const controller = new CreateSpreadController(
      logger,
      spreadRepository,
      operationService,
      eventEmitter,
    );

    const spread = await controller.execute(payload);

    logger.info('Spreads created.', { spread });

    return {
      ctx,
      value: spread,
    };
  }
}
