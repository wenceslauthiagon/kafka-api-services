import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import {
  EventEmitterParam,
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  ObserverController,
} from '@zro/common';
import {
  JdpiPixStatementInterceptor,
  JdpiPixStatementGatewayParam,
} from '@zro/jdpi';
import { PixStatementGateway } from '@zro/api-jdpi/application';
import {
  KAFKA_EVENTS,
  NotifyCreditValidationEventKafkaEmitter,
} from '@zro/api-jdpi/infrastructure';
import {
  HandlePendingNotifyCreditValidationEventController,
  HandlePendingNotifyCreditValidationEventRequest,
  NotifyCreditValidationEventEmitterControllerInterface,
} from '@zro/api-jdpi/interface';

export type HandlePendingNotifyCreditValidationEventKafkaRequest =
  KafkaMessage<HandlePendingNotifyCreditValidationEventRequest>;

/**
 * Pending notify credit validation events observer.
 */
@Controller()
@ObserverController([JdpiPixStatementInterceptor])
export class PendingNotifyCreditValidationNestObserver {
  /**
   * Handle pending notify credit validation event.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @param pspGateway Pix statement psp gateway.
   * @param serviceEventEmitter Notify credit validation event emitter.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.NOTIFY_CREDIT_VALIDATION.PENDING)
  async execute(
    @Payload('value') message: HandlePendingNotifyCreditValidationEventRequest,
    @LoggerParam(PendingNotifyCreditValidationNestObserver)
    logger: Logger,
    @JdpiPixStatementGatewayParam()
    pspGateway: PixStatementGateway,
    @EventEmitterParam(NotifyCreditValidationEventKafkaEmitter)
    serviceEventEmitter: NotifyCreditValidationEventEmitterControllerInterface,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandlePendingNotifyCreditValidationEventRequest(
      message,
    );

    logger.info('Handle pending notify credit validation event.', { payload });

    const controller = new HandlePendingNotifyCreditValidationEventController(
      logger,
      pspGateway,
      serviceEventEmitter,
    );

    try {
      // Call handle pending notify credit validation controller.
      const result = await controller.execute(payload);

      logger.info('Pending notify credit validated.', { result });
    } catch (error) {
      logger.error('Failed to validate pending notify credit.', error);

      // FIXME: Should notify IT team.
    }
  }
}
