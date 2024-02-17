import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  ObserverController,
  RepositoryParam,
  KafkaService,
  EventEmitterParam,
} from '@zro/common';
import { NotifyConfirmBankingTedRepository } from '@zro/api-topazio/domain';
import {
  KAFKA_EVENTS,
  KAFKA_HUB,
  NotifyConfirmBankingTedDatabaseRepository,
  NotifyConfirmBankingTedEventKafkaEmitter,
} from '@zro/api-topazio/infrastructure';
import {
  HandleNotifyConfirmBankingTedTopazioEventController,
  HandleNotifyConfirmBankingTedTopazioEventRequest,
  HandleFailedNotifyConfirmBankingTedTopazioEventController,
  NotifyConfirmBankingTedEventEmitterControllerInterface,
} from '@zro/api-topazio/interface';

export type HandleNotifyConfirmBankingTedTopazioEventKafkaRequest =
  KafkaMessage<HandleNotifyConfirmBankingTedTopazioEventRequest>;

/**
 * Notify completion banking ted topazio observer.
 */
@Controller()
@ObserverController()
export class NotifyConfirmBankingTedTopazioNestObserver {
  constructor(private kafkaService: KafkaService) {
    this.kafkaService.createEvents([
      KAFKA_HUB.NOTIFY_COMPLETION_BANKING_TED.BANKING_GATEWAY,
      KAFKA_HUB.NOTIFY_COMPLETION_BANKING_TED.DEAD_LETTER,
    ]);
  }

  /**
   * Handler triggered when notify completion banking ted.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.TOPAZIO.NOTIFY_CONFIRM_BANKING_TED)
  async handleNotifyConfirmBankingTedTopazioEvent(
    @Payload('value')
    message: HandleNotifyConfirmBankingTedTopazioEventRequest,
    @LoggerParam(NotifyConfirmBankingTedTopazioNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received notify completion banking ted event.', {
      value: message,
    });

    // Select banking gateway to send notify.
    await this.kafkaService.emit(
      KAFKA_HUB.NOTIFY_COMPLETION_BANKING_TED.BANKING_GATEWAY,
      ctx.getMessage(),
    );
  }

  /**
   * Handler triggered when notify completion banking ted.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.NOTIFY_COMPLETION_BANKING_TED.BANKING_GATEWAY)
  async handleNotifyConfirmBankingTedTopazioEventViaBanking(
    @Payload('value')
    message: HandleNotifyConfirmBankingTedTopazioEventRequest,
    @LoggerParam(NotifyConfirmBankingTedTopazioNestObserver)
    logger: Logger,
    @RepositoryParam(NotifyConfirmBankingTedDatabaseRepository)
    notifyConfirmBankingTedRepository: NotifyConfirmBankingTedRepository,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleNotifyConfirmBankingTedTopazioEventRequest(
      message,
    );

    logger.debug('Handle create completion banking ted event.', { payload });

    const controller = new HandleNotifyConfirmBankingTedTopazioEventController(
      logger,
      notifyConfirmBankingTedRepository,
    );

    try {
      // Call the banking controller.
      await controller.execute(payload);

      logger.debug('Success to notify completion banking ted process.');
    } catch (error) {
      logger.error('Failed to notify completion banking ted process.', {
        error,
      });

      // TODO: Enviar mensagem para a fila de retry
      // Isso aqui é temporário e deverá ser substituido o mais breve possível
      await this.kafkaService.emit(
        KAFKA_HUB.NOTIFY_COMPLETION_BANKING_TED.DEAD_LETTER,
        ctx.getMessage(),
      );

      throw error;
    }
  }

  /**
   * Handle Topazio dead letter event. Notify completion banking ted here have all retries failed.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.NOTIFY_COMPLETION_BANKING_TED.DEAD_LETTER)
  async handleNotifyConfirmBankingTedTopazioDeadLetterEvent(
    @Payload('value')
    message: HandleNotifyConfirmBankingTedTopazioEventRequest,
    @LoggerParam(NotifyConfirmBankingTedTopazioNestObserver)
    logger: Logger,
    @RepositoryParam(NotifyConfirmBankingTedDatabaseRepository)
    notifyConfirmBankingTedRepository: NotifyConfirmBankingTedRepository,
    @EventEmitterParam(NotifyConfirmBankingTedEventKafkaEmitter)
    eventEmitter: NotifyConfirmBankingTedEventEmitterControllerInterface,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleNotifyConfirmBankingTedTopazioEventRequest(
      message,
    );

    logger.debug('Handle failed completion banking ted event.', { payload });

    const controller =
      new HandleFailedNotifyConfirmBankingTedTopazioEventController(
        logger,
        notifyConfirmBankingTedRepository,
        eventEmitter,
      );

    try {
      // Call the notify controller.
      await controller.execute(payload);

      logger.debug('Success to save fail notify.');
    } catch (error) {
      logger.error('Failed to save a fail notify.', { error });
    }
  }
}
