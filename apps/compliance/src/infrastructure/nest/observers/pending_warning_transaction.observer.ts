import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { Logger } from 'winston';
import {
  EventEmitterParam,
  KafkaMessage,
  KafkaEventPattern,
  KafkaService,
  LoggerParam,
  ObserverController,
  RepositoryParam,
} from '@zro/common';
import { WarningTransactionRepository } from '@zro/compliance/domain';
import { WarningTransactionGateway } from '@zro/compliance/application';
import {
  WarningTransactionDatabaseRepository,
  WarningTransactionEventKafkaEmitter,
  KAFKA_EVENTS,
  KAFKA_HUB,
} from '@zro/compliance/infrastructure';
import {
  WarningTransactionEventEmitterControllerInterface,
  HandleWarningTransactionCreatedController,
  HandleWarningTransactionCreatedEventRequest,
  HandleWarningTransactionDeadLetterController,
  HandleWarningTransactionDeadLetterEventRequest,
} from '@zro/compliance/interface';
import {
  JiraWarningTransactionInterceptor,
  JiraWarningTransactionGatewayParam,
} from '@zro/jira';

export type HandleWarningTransactionCreatedEventKafka =
  KafkaMessage<HandleWarningTransactionCreatedEventRequest>;

export type HandleWarningTransactionDeadLetterEventKafka =
  KafkaMessage<HandleWarningTransactionDeadLetterEventRequest>;

/**
 * Warning transaction events observer.
 */
@Controller()
@ObserverController([JiraWarningTransactionInterceptor])
export class PendingWarningTransactionNestObserver {
  /**
   * Default warning transaction RPC controller constructor.
   * @param kafkaService
   */
  constructor(private kafkaService: KafkaService) {
    this.kafkaService.createEvents([KAFKA_HUB.WARNING_TRANSACTION.DEAD_LETTER]);
  }

  /**
   * Handle warning transaction created event and send it to gateway hub selector.
   * @param message Event Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.WARNING_TRANSACTION.PENDING)
  async handleWarningTransactionCreatedEvent(
    @Payload('value') message: HandleWarningTransactionCreatedEventRequest,
    @LoggerParam(PendingWarningTransactionNestObserver) logger: Logger,
    @Ctx() ctx: KafkaContext,
  ) {
    logger.debug('Received warning transaction created event', {
      event: message,
    });

    // Select warning transaction jira gateway to create at board.
    await this.kafkaService.emit(
      KAFKA_HUB.WARNING_TRANSACTION.JIRA_GATEWAY,
      ctx.getMessage(),
    );
  }

  /**
   * Handle Warning Transaction Created
   * @param message Event Kafka message.
   * @param warningTransactionRepository warning transaction repository.
   * @param warningTransactionEventEmitter E-mai event emitter.
   * @param jiraWarningTransactionGateway Warning transaction jira gateway.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.WARNING_TRANSACTION.JIRA_GATEWAY)
  async handleWarningTransactionCreatedEventViaJira(
    @Payload('value') message: HandleWarningTransactionCreatedEventRequest,
    @RepositoryParam(WarningTransactionDatabaseRepository)
    warningTransactionRepository: WarningTransactionRepository,
    @EventEmitterParam(WarningTransactionEventKafkaEmitter)
    warningTransactionEventEmitter: WarningTransactionEventEmitterControllerInterface,
    @LoggerParam(PendingWarningTransactionNestObserver)
    logger: Logger,
    @JiraWarningTransactionGatewayParam()
    jiraWarningTransactionGateway: WarningTransactionGateway,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleWarningTransactionCreatedEventRequest(message);

    logger.debug('Creating warning transaction at Jira.', { payload });

    try {
      const controller = new HandleWarningTransactionCreatedController(
        logger,
        warningTransactionRepository,
        warningTransactionEventEmitter,
        jiraWarningTransactionGateway,
      );

      // Send push warning transaction
      await controller.execute(payload);
    } catch (error) {
      logger.error('Failed to create warning transaction', { error });

      // TODO: Enviar notificação para a fila de retry
      // Isso aqui é temporário e deverá ser substituido o mais breve possível
      await this.kafkaService.emit(
        KAFKA_HUB.WARNING_TRANSACTION.DEAD_LETTER,
        ctx.getMessage(),
      );
    }
  }

  /**
   * Handle warning transaction dead letter event. Which one who failed to all retries.
   *
   * @param message Event Kafka message.
   * @param warningTransactionRepository warning transaction repository.
   * @param warningTransactionEventEmitter E-mai event emitter.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.WARNING_TRANSACTION.DEAD_LETTER)
  async handleWarningTransactionDeadLetterEvent(
    @Payload('value') message: HandleWarningTransactionDeadLetterEventRequest,
    @RepositoryParam(WarningTransactionDatabaseRepository)
    warningTransactionRepository: WarningTransactionRepository,
    @EventEmitterParam(WarningTransactionEventKafkaEmitter)
    warningTransactionEventEmitter: WarningTransactionEventEmitterControllerInterface,
    @LoggerParam(PendingWarningTransactionNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleWarningTransactionDeadLetterEventRequest(message);

    logger.debug('Failing to create warning transaction.', { payload });

    try {
      const controller = new HandleWarningTransactionDeadLetterController(
        warningTransactionRepository,
        warningTransactionEventEmitter,
        logger,
      );

      // Fail warning transaction.
      await controller.execute(payload);
    } catch (error) {
      logger.error('Failed to create warning transaction', { error });

      // FIXME: Should notify IT team.
    }
  }
}
