import { Logger } from 'winston';
import { Controller, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ctx, KafkaContext, Payload } from '@nestjs/microservices';
import {
  LoggerParam,
  RepositoryParam,
  ObserverController,
  EncryptService,
  EventEmitterParam,
  KafkaMessage,
  KafkaEventPattern,
  KafkaServiceParam,
  KafkaService,
} from '@zro/common';
import {
  WebhookEventRepository,
  WebhookRepository,
} from '@zro/webhooks/domain';
import { RetryService, WebhookTargetGateway } from '@zro/webhooks/application';
import {
  WebhookEventEmitterControllerInterface,
  HandleWebhookEventCreatedController,
  HandleWebhookEventCreatedRequest,
  HandleFailedWebhookEventCreatedRequest,
  HandleFailedWebhookEventCreatedController,
} from '@zro/webhooks/interface';
import {
  KAFKA_EVENTS,
  RetryServiceKafka,
  WebhookDatabaseRepository,
  WebhookEventDatabaseRepository,
  WebhookEventEventKafkaEmitter,
} from '@zro/webhooks/infrastructure';
import {
  AxiosWebhookTargetGatewayInterceptor,
  AxiosWebhookTargetGatewayParam,
} from '@zro/gateway-webhook';

export type HandleWebhookEventCreatedKakfaRequest =
  KafkaMessage<HandleWebhookEventCreatedRequest>;

export type HandleFailedWebhookEventCreatedKakfaRequest =
  KafkaMessage<HandleFailedWebhookEventCreatedRequest>;

interface RetryConfig {
  APP_RETRY_MIN_SECONDS: number;
  APP_RETRY_MAX_SECONDS: number;
}

/**
 * Webhooks notification events observer.
 */
@Controller()
@ObserverController([AxiosWebhookTargetGatewayInterceptor])
export class WebhookEventNestObserver {
  retryQueue: string = KAFKA_EVENTS.WEBHOOK_EVENT.CREATED;
  failedQueue = '';
  RETRY_MIN_SECONDS = 10;
  RETRY_MAX_SECONDS = 3600;

  constructor(
    private encryptService: EncryptService,
    configService: ConfigService<RetryConfig>,
    private kafkaService: KafkaService,
  ) {
    this.RETRY_MIN_SECONDS = configService.get<number>(
      'APP_RETRY_MIN_SECONDS',
      10,
    );

    this.RETRY_MAX_SECONDS = configService.get<number>(
      'APP_RETRY_MAX_SECONDS',
      3600,
    );
  }

  @KafkaEventPattern(KAFKA_EVENTS.WEBHOOK_EVENT.CREATED)
  async handleCreatedWebhookEvent(
    @Payload('value') message: HandleWebhookEventCreatedRequest,
    @RepositoryParam(WebhookEventDatabaseRepository)
    webhookEventRepository: WebhookEventRepository,
    @AxiosWebhookTargetGatewayParam()
    webhookTargetGateway: WebhookTargetGateway,
    @EventEmitterParam(WebhookEventEventKafkaEmitter)
    eventEmitter: WebhookEventEmitterControllerInterface,
    @LoggerParam(WebhookEventNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleWebhookEventCreatedRequest(message);

    logger.info('Send webhook event created notification.', { payload });

    const controller = new HandleWebhookEventCreatedController(
      logger,
      webhookEventRepository,
      webhookTargetGateway,
      this.encryptService,
      eventEmitter,
    );

    try {
      // Call the handle webhook event created event controller.
      const result = await controller.execute(payload);

      logger.info('Handle webhook event created notification.', { result });
    } catch (error) {
      logger.error(
        'Failed to send handle webhook event created notification.',
        error,
      );

      const value: HandleFailedWebhookEventCreatedRequest = {
        id: message.id,
        httpStatusCodeResponse: HttpStatus.INTERNAL_SERVER_ERROR.toString(),
      };

      await this.kafkaService.emit(
        KAFKA_EVENTS.WEBHOOK_EVENT.NOTIFY_CREATED_FAILED,
        { ...ctx.getMessage(), value },
      );
    }
  }

  @KafkaEventPattern(KAFKA_EVENTS.WEBHOOK_EVENT.NOTIFY_CREATED_FAILED)
  async handleFailedCreatedWebhookEvent(
    @Payload('value') message: HandleFailedWebhookEventCreatedRequest,
    @RepositoryParam(WebhookEventDatabaseRepository)
    webhookEventRepository: WebhookEventRepository,
    @RepositoryParam(WebhookDatabaseRepository)
    webhookRepository: WebhookRepository,
    @KafkaServiceParam(RetryServiceKafka)
    retryService: RetryService,
    @LoggerParam(WebhookEventNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    const payload = new HandleFailedWebhookEventCreatedRequest(message);

    logger.info('Send webhook failed event created notification.', { payload });

    const controller = new HandleFailedWebhookEventCreatedController(
      logger,
      webhookEventRepository,
      webhookRepository,
      retryService,
      this.retryQueue,
      this.failedQueue,
      this.RETRY_MIN_SECONDS,
      this.RETRY_MAX_SECONDS,
    );

    try {
      // Call the handle webhook event created event controller.
      const result = await controller.execute(payload);

      logger.info('Handle failed webhook event created notification', {
        result,
      });
    } catch (error) {
      logger.error(
        'Failed to send handle failed webhook event created notification.',
        error,
      );

      // FIXME: Should notify IT team.
    }
  }
}
