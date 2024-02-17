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
  HandleNotifyUpdatePixInfractionIssueEventController,
  HandleFailedNotifyUpdatePixInfractionIssueEventController,
  HandleNotifyUpdatePixInfractionIssueEventRequest,
  NotifyPixInfractionIssueEventEmitterControllerInterface,
} from '@zro/api-jira/interface';

export type HandleNotifyUpdatePixInfractionIssueEventKafkaRequest =
  KafkaMessage<HandleNotifyUpdatePixInfractionIssueEventRequest>;

/**
 * Notify update issue observer.
 */
@Controller()
@ObserverController()
export class NotifyUpdatePixInfractionIssueNestObserver {
  constructor(private kafkaService: KafkaService) {
    this.kafkaService.createEvents([
      KAFKA_HUB.ISSUE.INFRACTION.NOTIFY_UPDATE.PAYMENT_GATEWAY,
      KAFKA_HUB.ISSUE.INFRACTION.NOTIFY_UPDATE.DEAD_LETTER,
    ]);
  }

  /**
   * Handler triggered when notify update.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.ISSUE.INFRACTION.NOTIFY_UPDATE)
  async handleNotifyUpdatePixInfractionIssueEvent(
    @Payload('value') message: HandleNotifyUpdatePixInfractionIssueEventRequest,
    @LoggerParam(NotifyUpdatePixInfractionIssueNestObserver) logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received notify update issue event.', {
      value: message,
    });

    // Select pix gateway to send notify.
    await this.kafkaService.emit(
      KAFKA_HUB.ISSUE.INFRACTION.NOTIFY_UPDATE.PAYMENT_GATEWAY,
      ctx.getMessage(),
    );
  }

  /**
   * Handler triggered when notify update issue.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.ISSUE.INFRACTION.NOTIFY_UPDATE.PAYMENT_GATEWAY)
  async handleNotifyUpdatePixInfractionIssueEventViaPixPayment(
    @Payload('value') message: HandleNotifyUpdatePixInfractionIssueEventRequest,
    @LoggerParam(NotifyUpdatePixInfractionIssueNestObserver) logger: Logger,
    @RepositoryParam(NotifyPixInfractionIssueDatabaseRepository)
    notifyIssueRepository: NotifyPixInfractionIssueRepository,
    @KafkaServiceParam(PixPaymentServiceKafka)
    pixPaymentService: PixPaymentServiceKafka,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleNotifyUpdatePixInfractionIssueEventRequest(
      message,
    );

    logger.debug('Handle notify update issue event.', { payload });

    const controller = new HandleNotifyUpdatePixInfractionIssueEventController(
      logger,
      notifyIssueRepository,
      pixPaymentService,
    );

    try {
      // Call controller.
      await controller.execute(payload);

      logger.debug('Success to notify update process.');
    } catch (error) {
      logger.error('Failed to notify update process.', { error });

      // TODO: Enviar mensagem para a fila de retry
      // Isso aqui é temporário e deverá ser substituido o mais breve possível
      await this.kafkaService.emit(
        KAFKA_HUB.ISSUE.INFRACTION.NOTIFY_UPDATE.DEAD_LETTER,
        ctx.getMessage(),
      );

      throw error;
    }
  }

  /**
   * Handle Issue dead letter event. Notify update here have all retries failed.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.ISSUE.INFRACTION.NOTIFY_UPDATE.DEAD_LETTER)
  async handleNotifyUpdatePixInfractionIssueDeadLetterEvent(
    @Payload('value') message: HandleNotifyUpdatePixInfractionIssueEventRequest,
    @LoggerParam(NotifyUpdatePixInfractionIssueNestObserver) logger: Logger,
    @RepositoryParam(NotifyPixInfractionIssueDatabaseRepository)
    notifyIssueRepository: NotifyPixInfractionIssueRepository,
    @EventEmitterParam(NotifyPixInfractionIssueEventKafkaEmitter)
    eventEmitter: NotifyPixInfractionIssueEventEmitterControllerInterface,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleNotifyUpdatePixInfractionIssueEventRequest(
      message,
    );

    logger.debug('Handle failed update issue event.', { payload });

    const controller =
      new HandleFailedNotifyUpdatePixInfractionIssueEventController(
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
