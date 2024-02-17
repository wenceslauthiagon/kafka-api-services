import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  ObserverController,
  KafkaService,
  RepositoryParam,
  EventEmitterParam,
  KafkaServiceParam,
} from '@zro/common';
import { NotifyPixInfractionIssueRepository } from '@zro/api-jira/domain';
import {
  KAFKA_EVENTS,
  KAFKA_HUB,
  NotifyPixInfractionIssueEventKafkaEmitter,
  NotifyPixInfractionIssueDatabaseRepository,
  PixPaymentServiceKafka,
} from '@zro/api-jira/infrastructure';
import {
  HandleNotifyCreatePixInfractionIssueEventController,
  HandleFailedNotifyCreatePixInfractionIssueEventController,
  HandleNotifyCreatePixInfractionIssueEventRequest,
  NotifyPixInfractionIssueEventEmitterControllerInterface,
} from '@zro/api-jira/interface';

export type HandleNotifyCreatePixInfractionIssueEventKafkaRequest =
  KafkaMessage<HandleNotifyCreatePixInfractionIssueEventRequest>;

/**
 * Notify create issue observer.
 */
@Controller()
@ObserverController()
export class NotifyCreatePixInfractionIssueNestObserver {
  constructor(private kafkaService: KafkaService) {
    this.kafkaService.createEvents([
      KAFKA_HUB.ISSUE.INFRACTION.NOTIFY_CREATE.PAYMENT_GATEWAY,
      KAFKA_HUB.ISSUE.INFRACTION.NOTIFY_CREATE.DEAD_LETTER,
    ]);
  }

  /**
   * Handler triggered when notify create.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.ISSUE.INFRACTION.NOTIFY_CREATE)
  async handleNotifyCreatePixInfractionIssueEvent(
    @Payload('value')
    message: HandleNotifyCreatePixInfractionIssueEventKafkaRequest,
    @LoggerParam(NotifyCreatePixInfractionIssueNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received notify create issue event.', { value: message });

    // Select pix gateway to send notify.
    await this.kafkaService.emit(
      KAFKA_HUB.ISSUE.INFRACTION.NOTIFY_CREATE.PAYMENT_GATEWAY,
      ctx.getMessage(),
    );
  }

  /**
   * Handler triggered when notify create issue.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.ISSUE.INFRACTION.NOTIFY_CREATE.PAYMENT_GATEWAY)
  async handleNotifyCreatePixInfractionIssueEventViaPixPayment(
    @Payload('value') message: HandleNotifyCreatePixInfractionIssueEventRequest,
    @LoggerParam(NotifyCreatePixInfractionIssueNestObserver)
    logger: Logger,
    @RepositoryParam(NotifyPixInfractionIssueDatabaseRepository)
    notifyIssueRepository: NotifyPixInfractionIssueRepository,
    @KafkaServiceParam(PixPaymentServiceKafka)
    pixPaymentService: PixPaymentServiceKafka,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleNotifyCreatePixInfractionIssueEventRequest(
      message,
    );

    logger.debug('Handle notify create issue event.', { payload });

    const controller = new HandleNotifyCreatePixInfractionIssueEventController(
      logger,
      notifyIssueRepository,
      pixPaymentService,
    );

    try {
      // Call controller.
      await controller.execute(payload);

      logger.debug('Success to notify create process.');
    } catch (error) {
      logger.error('Failed to notify create process.', { error });

      // TODO: Enviar mensagem para a fila de retry
      // Isso aqui é temporário e deverá ser substituido o mais breve possível
      await this.kafkaService.emit(
        KAFKA_HUB.ISSUE.INFRACTION.NOTIFY_CREATE.DEAD_LETTER,
        ctx.getMessage(),
      );

      throw error;
    }
  }

  /**
   * Handle Issue dead letter event. Notify create here have all retries failed.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.ISSUE.INFRACTION.NOTIFY_CREATE.DEAD_LETTER)
  async handleNotifyCreatePixInfractionIssueDeadLetterEvent(
    @Payload('value') message: HandleNotifyCreatePixInfractionIssueEventRequest,
    @LoggerParam(NotifyCreatePixInfractionIssueNestObserver)
    logger: Logger,
    @RepositoryParam(NotifyPixInfractionIssueDatabaseRepository)
    notifyIssueRepository: NotifyPixInfractionIssueRepository,
    @EventEmitterParam(NotifyPixInfractionIssueEventKafkaEmitter)
    eventEmitter: NotifyPixInfractionIssueEventEmitterControllerInterface,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleNotifyCreatePixInfractionIssueEventRequest(
      message,
    );

    logger.debug('Handle failed create issue event.', { payload });

    const controller =
      new HandleFailedNotifyCreatePixInfractionIssueEventController(
        logger,
        notifyIssueRepository,
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
