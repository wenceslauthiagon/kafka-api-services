import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  EventEmitterParam,
  LoggerParam,
  RepositoryParam,
  ObserverController,
  KafkaServiceParam,
  MissingEnvVarException,
} from '@zro/common';
import {
  PixDepositRepository,
  PixDevolutionRepository,
} from '@zro/pix-payments/domain';
import {
  PixDevolutionDatabaseRepository,
  PixDevolutionEventKafkaEmitter,
  KAFKA_EVENTS,
  OperationServiceKafka,
  PixDepositDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import {
  HandleCompletePixDevolutionEventController,
  PixDevolutionEventEmitterControllerInterface,
  HandleCompletePixDevolutionEventRequest,
} from '@zro/pix-payments/interface';
import { ConfigService } from '@nestjs/config';

export type HandleCompletePixDevolutionEventKafkaRequest =
  KafkaMessage<HandleCompletePixDevolutionEventRequest>;

interface PixDevolutionCompleteOperationConfig {
  APP_OPERATION_SEND_DEVOLUTION_TRANSACTION_TAG: string;
}

/**
 * PixDevolution complete events observer.
 */
@Controller()
@ObserverController()
export class CompletePixDevolutionNestObserver {
  private pixSendDevolutionOperationTransactionTag: string;

  constructor(
    private configService: ConfigService<PixDevolutionCompleteOperationConfig>,
  ) {
    this.pixSendDevolutionOperationTransactionTag =
      this.configService.get<string>(
        'APP_OPERATION_SEND_DEVOLUTION_TRANSACTION_TAG',
      );

    if (!this.pixSendDevolutionOperationTransactionTag) {
      throw new MissingEnvVarException([
        'APP_OPERATION_SEND_DEVOLUTION_TRANSACTION_TAG',
      ]);
    }
  }
  /**
   * Handler triggered when devolution is complete.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.PIX_DEVOLUTION.COMPLETED)
  async execute(
    @Payload('value') message: HandleCompletePixDevolutionEventRequest,
    @RepositoryParam(PixDevolutionDatabaseRepository)
    devolutionRepository: PixDevolutionRepository,
    @RepositoryParam(PixDepositDatabaseRepository)
    depositRepository: PixDepositRepository,
    @EventEmitterParam(PixDevolutionEventKafkaEmitter)
    serviceEventEmitter: PixDevolutionEventEmitterControllerInterface,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @LoggerParam(CompletePixDevolutionNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleCompletePixDevolutionEventRequest(message);

    logger.info('Handle added event complete devolution.', { payload });

    const controller = new HandleCompletePixDevolutionEventController(
      logger,
      devolutionRepository,
      serviceEventEmitter,
      operationService,
      depositRepository,
      this.pixSendDevolutionOperationTransactionTag,
    );

    try {
      // Call the devolution controller.
      const result = await controller.execute(payload);

      logger.info('Devolution completed.', { result });
    } catch (error) {
      logger.error('Failed to complete devolution.', error);

      // FIXME: Should notify IT team.
    }
  }
}
