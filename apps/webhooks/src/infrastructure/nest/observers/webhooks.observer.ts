import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  RepositoryParam,
  ObserverController,
  KafkaServiceParam,
  EventEmitterParam,
} from '@zro/common';
import {
  WebhookEventRepository,
  WebhookRepository,
} from '@zro/webhooks/domain';
import { PixPaymentService } from '@zro/webhooks/application';
import { KAFKA_EVENTS } from '@zro/pix-payments/infrastructure';
import {
  SendPaymentStateChangeNotificationRequest,
  ReceivePixDevolutionStateChangeNotificationRequest,
  SendPixDevolutionStateChangeNotificationRequest,
  SendPixDepositStateChangeNotificationRequest,
} from '@zro/notifications/interface';
import {
  HandleWebhookPaymentCompletedEventController,
  HandleWebhookDevolutionReceivedEventController,
  HandleWebhookPaymentCompletedEventRequest,
  HandleWebhookDevolutionReceivedEventRequest,
  WebhookEventEmitterControllerInterface,
  HandleWebhookDepositReceivedEventRequest,
  HandleWebhookDepositReceivedEventController,
  HandleWebhookDevolutionCompletedEventRequest,
  HandleWebhookDevolutionCompletedEventController,
  HandleWebhookPaymentFailedEventController,
  HandleWebhookPaymentFailedEventRequest,
  HandleWebhookDevolutionFailedEventController,
  HandleWebhookDevolutionFailedEventRequest,
} from '@zro/webhooks/interface';
import {
  WebhookDatabaseRepository,
  WebhookEventDatabaseRepository,
  WebhookEventEventKafkaEmitter,
  PixPaymentServiceKafka,
} from '@zro/webhooks/infrastructure';
import { AxiosWebhookTargetGatewayInterceptor } from '@zro/gateway-webhook';

export type PaymentEventKafkaRequest =
  KafkaMessage<SendPaymentStateChangeNotificationRequest>;

export type DevolutionReceivedEventKafkaRequest =
  KafkaMessage<ReceivePixDevolutionStateChangeNotificationRequest>;

export type DevolutionEventKafkaRequest =
  KafkaMessage<SendPixDevolutionStateChangeNotificationRequest>;

export type PixDepositEventKafkaRequest =
  KafkaMessage<SendPixDepositStateChangeNotificationRequest>;

/**
 * Webhooks notification events observer.
 */
@Controller()
@ObserverController([AxiosWebhookTargetGatewayInterceptor])
export class WebhooksNestObserver {
  @KafkaEventPattern(KAFKA_EVENTS.PAYMENT.CONFIRMED)
  async handleConfirmedPaymentEvent(
    @Payload('value') message: SendPaymentStateChangeNotificationRequest,
    @RepositoryParam(WebhookDatabaseRepository)
    webhookRepository: WebhookRepository,
    @RepositoryParam(WebhookEventDatabaseRepository)
    webhookEventRepository: WebhookEventRepository,
    @KafkaServiceParam(PixPaymentServiceKafka)
    pixPaymentService: PixPaymentService,
    @EventEmitterParam(WebhookEventEventKafkaEmitter)
    eventEmitter: WebhookEventEmitterControllerInterface,
    @LoggerParam(WebhooksNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleWebhookPaymentCompletedEventRequest({
      id: message.id,
    });

    logger.info('Send devolution received notification.', { payload });

    const controller = new HandleWebhookPaymentCompletedEventController(
      logger,
      webhookRepository,
      webhookEventRepository,
      pixPaymentService,
      eventEmitter,
    );

    try {
      // Call the handle payment completed event controller.
      const result = await controller.execute(payload);

      logger.info('Confirmed payment notification.', { result });
    } catch (error) {
      logger.error('Failed to send confirmed payment notification.', error);

      // FIXME: Should notify IT team.
    }
  }

  @KafkaEventPattern(KAFKA_EVENTS.PIX_DEVOLUTION_RECEIVED.READY)
  async handleDevolutionReceivedEvent(
    @Payload('value')
    message: ReceivePixDevolutionStateChangeNotificationRequest,
    @RepositoryParam(WebhookDatabaseRepository)
    webhookRepository: WebhookRepository,
    @RepositoryParam(WebhookEventDatabaseRepository)
    webhookEventRepository: WebhookEventRepository,
    @KafkaServiceParam(PixPaymentServiceKafka)
    pixPaymentService: PixPaymentService,
    @EventEmitterParam(WebhookEventEventKafkaEmitter)
    eventEmitter: WebhookEventEmitterControllerInterface,
    @LoggerParam(WebhooksNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleWebhookDevolutionReceivedEventRequest({
      id: message.id,
    });

    logger.info('Send devolution received notification.', { payload });

    const controller = new HandleWebhookDevolutionReceivedEventController(
      logger,
      webhookRepository,
      webhookEventRepository,
      pixPaymentService,
      eventEmitter,
    );

    try {
      // Call the handle devolution received event controller.
      const result = await controller.execute(payload);

      logger.info('Devolution received notification.', { result });
    } catch (error) {
      logger.error('Failed to send devolution received notification.', {
        error,
      });

      // FIXME: Should notify IT team.
    }
  }

  @KafkaEventPattern(KAFKA_EVENTS.PIX_DEPOSIT.RECEIVED)
  async handleDepositReceivedEvent(
    @Payload('value') message: SendPixDepositStateChangeNotificationRequest,
    @RepositoryParam(WebhookDatabaseRepository)
    webhookRepository: WebhookRepository,
    @RepositoryParam(WebhookEventDatabaseRepository)
    webhookEventRepository: WebhookEventRepository,
    @KafkaServiceParam(PixPaymentServiceKafka)
    pixPaymentService: PixPaymentService,
    @EventEmitterParam(WebhookEventEventKafkaEmitter)
    eventEmitter: WebhookEventEmitterControllerInterface,
    @LoggerParam(WebhooksNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleWebhookDepositReceivedEventRequest({
      id: message.id,
      userId: message.userId,
    });

    logger.info('Send deposit received notification.', { payload });

    const controller = new HandleWebhookDepositReceivedEventController(
      logger,
      webhookRepository,
      webhookEventRepository,
      pixPaymentService,
      eventEmitter,
    );

    try {
      // Call the handle payment completed event controller.
      const result = await controller.execute(payload);

      logger.info('Received deposit notification.', { result });
    } catch (error) {
      logger.error('Failed to send received deposit notification.', error);

      // FIXME: Should notify IT team.
    }
  }

  @KafkaEventPattern(KAFKA_EVENTS.PIX_DEVOLUTION.CONFIRMED)
  async handleConfirmedDevolutionEvent(
    @Payload('value') message: SendPixDevolutionStateChangeNotificationRequest,
    @RepositoryParam(WebhookDatabaseRepository)
    webhookRepository: WebhookRepository,
    @RepositoryParam(WebhookEventDatabaseRepository)
    webhookEventRepository: WebhookEventRepository,
    @KafkaServiceParam(PixPaymentServiceKafka)
    pixPaymentService: PixPaymentService,
    @EventEmitterParam(WebhookEventEventKafkaEmitter)
    eventEmitter: WebhookEventEmitterControllerInterface,
    @LoggerParam(WebhooksNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleWebhookDevolutionCompletedEventRequest({
      id: message.id,
    });

    logger.info('Send devolution completed notification.', { payload });

    const controller = new HandleWebhookDevolutionCompletedEventController(
      logger,
      webhookRepository,
      webhookEventRepository,
      pixPaymentService,
      eventEmitter,
    );

    try {
      // Call the handle devolution completed event controller.
      const result = await controller.execute(payload);

      logger.info('Devolution completed notification.', { result });
    } catch (error) {
      logger.error('Failed to send devolution completed notification.', {
        error,
      });

      // FIXME: Should notify IT team.
    }
  }

  @KafkaEventPattern(KAFKA_EVENTS.PAYMENT.FAILED)
  async handleFailedPaymentEvent(
    @Payload('value')
    message: SendPaymentStateChangeNotificationRequest,
    @RepositoryParam(WebhookDatabaseRepository)
    webhookRepository: WebhookRepository,
    @RepositoryParam(WebhookEventDatabaseRepository)
    webhookEventRepository: WebhookEventRepository,
    @KafkaServiceParam(PixPaymentServiceKafka)
    pixPaymentService: PixPaymentService,
    @EventEmitterParam(WebhookEventEventKafkaEmitter)
    eventEmitter: WebhookEventEmitterControllerInterface,
    @LoggerParam(WebhooksNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleWebhookPaymentFailedEventRequest({
      id: message.id,
    });

    logger.info('Send payment failed notification.', { payload });

    const controller = new HandleWebhookPaymentFailedEventController(
      logger,
      webhookRepository,
      webhookEventRepository,
      pixPaymentService,
      eventEmitter,
    );

    try {
      // Call the handle payment failed event controller.
      const result = await controller.execute(payload);

      logger.info('Failed payment notification.', { result });
    } catch (error) {
      logger.error('Failed to send failed payment notification.', error);
    }
  }

  @KafkaEventPattern(KAFKA_EVENTS.PIX_DEVOLUTION.FAILED)
  async handleFailedPixDevolution(
    @Payload('value')
    message: SendPixDevolutionStateChangeNotificationRequest,
    @RepositoryParam(WebhookDatabaseRepository)
    webhookRepository: WebhookRepository,
    @RepositoryParam(WebhookEventDatabaseRepository)
    webhookEventRepository: WebhookEventRepository,
    @KafkaServiceParam(PixPaymentServiceKafka)
    pixPaymentService: PixPaymentService,
    @EventEmitterParam(WebhookEventEventKafkaEmitter)
    eventEmitter: WebhookEventEmitterControllerInterface,
    @LoggerParam(WebhooksNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    const payload = new HandleWebhookDevolutionFailedEventRequest({
      id: message.id,
    });

    logger.info('Send devolution failed notification.', { payload });

    const controller = new HandleWebhookDevolutionFailedEventController(
      logger,
      webhookRepository,
      webhookEventRepository,
      pixPaymentService,
      eventEmitter,
    );

    try {
      // Call the handle devolution failed event controller.
      const result = await controller.execute(payload);

      logger.info('Failed devolution notification.', { result });
    } catch (error) {
      logger.error('Failed to send failed devolution notification.', error);
    }
  }
}
