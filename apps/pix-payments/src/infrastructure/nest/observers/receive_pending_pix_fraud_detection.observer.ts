import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  RepositoryParam,
  ObserverController,
  EventEmitterParam,
  TranslateService,
  KafkaService,
} from '@zro/common';
import {
  JiraPixFraudDetectionGatewayParam,
  JiraPixFraudDetectionInterceptor,
} from '@zro/jira';
import { PixFraudDetectionRepository } from '@zro/pix-payments/domain';
import { IssuePixFraudDetectionGateway } from '@zro/pix-payments/application';
import {
  KAFKA_EVENTS,
  PixFraudDetectionDatabaseRepository,
  PixFraudDetectionEventKafkaEmitter,
} from '@zro/pix-payments/infrastructure';
import {
  HandlePixFraudDetectionDeadLetterEventRequest,
  HandleReceivePendingPixFraudDetectionEventController,
  HandleReceivePendingPixFraudDetectionEventRequest,
  PixFraudDetectionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type HandleReceivePendingPixFraudDetectionEventKafkaRequest =
  KafkaMessage<HandleReceivePendingPixFraudDetectionEventRequest>;

/**
 * Receive pending pix fraud detection events observer.
 */
@Controller()
@ObserverController([JiraPixFraudDetectionInterceptor])
export class ReceivePendingPixFraudDetectionNestObserver {
  constructor(
    private translateService: TranslateService,
    private kafkaService: KafkaService,
  ) {}

  /**
   * Handler triggered when received fraudDetection is pending.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.PIX_FRAUD_DETECTION.RECEIVED_PENDING)
  async execute(
    @Payload('value')
    message: HandleReceivePendingPixFraudDetectionEventRequest,
    @JiraPixFraudDetectionGatewayParam()
    pixFraudDetectionGateway: IssuePixFraudDetectionGateway,
    @RepositoryParam(PixFraudDetectionDatabaseRepository)
    pixFraudDetectionRepository: PixFraudDetectionRepository,
    @EventEmitterParam(PixFraudDetectionEventKafkaEmitter)
    pixFraudDetectionEventEmitter: PixFraudDetectionEventEmitterControllerInterface,
    @LoggerParam(ReceivePendingPixFraudDetectionNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleReceivePendingPixFraudDetectionEventRequest(
      message,
    );

    logger.info('Handle received pending pix fraud detection event.', {
      payload,
    });

    const controller = new HandleReceivePendingPixFraudDetectionEventController(
      logger,
      pixFraudDetectionRepository,
      pixFraudDetectionGateway,
      pixFraudDetectionEventEmitter,
    );

    try {
      // Call receive pending pix fraud detection handler.
      const result = await controller.execute(payload);

      logger.info('Received pending pix fraud detection.', { result });
    } catch (error) {
      const logError = error.data?.isAxiosError ? error.data.message : error;
      logger.error('Failed to receive pending pix fraud detection.', {
        error: logError,
      });

      const errorMessage = await this.translateService.translateException(
        'default_exceptions',
        error,
      );

      const value: HandlePixFraudDetectionDeadLetterEventRequest = {
        id: message.id,
        failedMessage: error.code,
        failedCode: errorMessage,
      };

      await this.kafkaService.emit(KAFKA_EVENTS.PIX_FRAUD_DETECTION.FAILED, {
        ...ctx.getMessage(),
        value,
      });
    }
  }
}
