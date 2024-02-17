import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
  KafkaServiceParam,
  EventEmitterParam,
} from '@zro/common';
import { SpreadRepository } from '@zro/otc/domain';
import {
  DeleteSpreadController,
  DeleteSpreadRequest,
  SpreadEventEmitterControllerInterface,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  OperationServiceKafka,
  SpreadDatabaseRepository,
  SpreadEventKafkaEmitter,
} from '@zro/otc/infrastructure';

export type DeleteSpreadKafkaRequest = KafkaMessage<DeleteSpreadRequest>;

/**
 * Spread controller.
 */
@Controller()
@MicroserviceController()
export class DeleteSpreadMicroserviceController {
  /**
   * Consumer of delete spread.
   *
   * @param spreadRepository Spread repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.SPREAD.DELETE)
  async execute(
    @RepositoryParam(SpreadDatabaseRepository)
    spreadRepository: SpreadRepository,
    @EventEmitterParam(SpreadEventKafkaEmitter)
    eventEmitter: SpreadEventEmitterControllerInterface,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @LoggerParam(DeleteSpreadMicroserviceController)
    logger: Logger,
    @Payload('value') message: DeleteSpreadRequest,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new DeleteSpreadRequest(message);

    // Delete and call delete spread controller.
    const controller = new DeleteSpreadController(
      logger,
      spreadRepository,
      operationService,
      eventEmitter,
    );

    await controller.execute(payload);

    logger.info('Spread deleted.', { spread: payload });
  }
}
