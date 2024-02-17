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
  KafkaServiceParam,
  EventEmitterParam,
} from '@zro/common';
import { NotifyRegisterBankingTedRepository } from '@zro/api-topazio/domain';
import {
  KAFKA_EVENTS,
  KAFKA_HUB,
  NotifyRegisterBankingTedDatabaseRepository,
  BankingServiceKafka,
  AdminBankingServiceKafka,
  NotifyRegisterBankingTedEventKafkaEmitter,
} from '@zro/api-topazio/infrastructure';
import {
  HandleNotifyRegisterBankingTedTopazioEventController,
  HandleNotifyRegisterBankingTedTopazioEventRequest,
  HandleFailedNotifyRegisterBankingTedTopazioEventController,
  NotifyRegisterBankingTedEventEmitterControllerInterface,
} from '@zro/api-topazio/interface';

export type HandleNotifyRegisterBankingTedTopazioEventKafkaRequest =
  KafkaMessage<HandleNotifyRegisterBankingTedTopazioEventRequest>;

/**
 * Notify register banking ted topazio observer.
 */
@Controller()
@ObserverController()
export class NotifyRegisterBankingTedTopazioNestObserver {
  constructor(private kafkaService: KafkaService) {
    this.kafkaService.createEvents([
      KAFKA_HUB.NOTIFY_REGISTER_BANKING_TED.BANKING_GATEWAY,
      KAFKA_HUB.NOTIFY_REGISTER_BANKING_TED.DEAD_LETTER,
    ]);
  }

  /**
   * Handler triggered when notify register banking ted.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.TOPAZIO.NOTIFY_REGISTER_BANKING_TED)
  async handleNotifyRegisterBankingTedTopazioEvent(
    @Payload('value')
    message: HandleNotifyRegisterBankingTedTopazioEventRequest,
    @LoggerParam(NotifyRegisterBankingTedTopazioNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received notify register banking ted event.', {
      value: message,
    });

    // Select banking gateway to send notify.
    await this.kafkaService.emit(
      KAFKA_HUB.NOTIFY_REGISTER_BANKING_TED.BANKING_GATEWAY,
      ctx.getMessage(),
    );
  }

  /**
   * Handler triggered when notify register banking ted.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.NOTIFY_REGISTER_BANKING_TED.BANKING_GATEWAY)
  async handleNotifyRegisterBankingTedTopazioEventViaBanking(
    @Payload('value')
    message: HandleNotifyRegisterBankingTedTopazioEventRequest,
    @LoggerParam(NotifyRegisterBankingTedTopazioNestObserver)
    logger: Logger,
    @RepositoryParam(NotifyRegisterBankingTedDatabaseRepository)
    notifyRegisterBankingTedRepository: NotifyRegisterBankingTedRepository,
    @KafkaServiceParam(BankingServiceKafka)
    bankingService: BankingServiceKafka,
    @KafkaServiceParam(AdminBankingServiceKafka)
    adminBankingService: AdminBankingServiceKafka,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleNotifyRegisterBankingTedTopazioEventRequest(
      message,
    );

    logger.debug('Handle create register banking ted event.', { payload });

    const controller = new HandleNotifyRegisterBankingTedTopazioEventController(
      logger,
      notifyRegisterBankingTedRepository,
      bankingService,
      adminBankingService,
    );

    try {
      // Call the banking controller.
      await controller.execute(payload);

      logger.debug('Success to notify register banking ted process.');
    } catch (error) {
      logger.error('Failed to notify register banking ted process.', { error });

      // TODO: Enviar mensagem para a fila de retry
      // Isso aqui é temporário e deverá ser substituido o mais breve possível
      await this.kafkaService.emit(
        KAFKA_HUB.NOTIFY_REGISTER_BANKING_TED.DEAD_LETTER,
        ctx.getMessage(),
      );

      throw error;
    }
  }

  /**
   * Handle Topazio dead letter event. Notify register banking ted here have all retries failed.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.NOTIFY_REGISTER_BANKING_TED.DEAD_LETTER)
  async handleNotifyRegisterBankingTedTopazioDeadLetterEvent(
    @Payload('value')
    message: HandleNotifyRegisterBankingTedTopazioEventRequest,
    @LoggerParam(NotifyRegisterBankingTedTopazioNestObserver)
    logger: Logger,
    @RepositoryParam(NotifyRegisterBankingTedDatabaseRepository)
    notifyRegisterBankingTedRepository: NotifyRegisterBankingTedRepository,
    @EventEmitterParam(NotifyRegisterBankingTedEventKafkaEmitter)
    eventEmitter: NotifyRegisterBankingTedEventEmitterControllerInterface,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleNotifyRegisterBankingTedTopazioEventRequest(
      message,
    );

    logger.debug('Handle failed register banking ted event.', { payload });

    const controller =
      new HandleFailedNotifyRegisterBankingTedTopazioEventController(
        logger,
        notifyRegisterBankingTedRepository,
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
