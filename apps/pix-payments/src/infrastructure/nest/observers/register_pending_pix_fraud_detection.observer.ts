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
import { PixFraudDetectionRepository } from '@zro/pix-payments/domain';
import {
  IssuePixFraudDetectionGateway,
  PixFraudDetectionGateway,
} from '@zro/pix-payments/application';
import {
  KAFKA_EVENTS,
  PixFraudDetectionDatabaseRepository,
  PixFraudDetectionEventKafkaEmitter,
} from '@zro/pix-payments/infrastructure';
import {
  HandlePixFraudDetectionDeadLetterEventRequest,
  HandleRegisterPendingPixFraudDetectionEventController,
  HandleRegisterPendingPixFraudDetectionEventRequest,
  PixFraudDetectionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import {
  JdpiPixFraudDetectionGatewayParam,
  JdpiPixFraudDetectionInterceptor,
} from '@zro/jdpi';
import {
  JiraPixFraudDetectionGatewayParam,
  JiraPixFraudDetectionInterceptor,
} from '@zro/jira';

export type HandleRegisterPendingPixFraudDetectionEventKafkaRequest =
  KafkaMessage<HandleRegisterPendingPixFraudDetectionEventRequest>;

/**
 * Register pending pix fraud detection events observer.
 */
@Controller()
@ObserverController([
  JdpiPixFraudDetectionInterceptor,
  JiraPixFraudDetectionInterceptor,
])
export class RegisterPendingPixFraudDetectionNestObserver {
  constructor(
    private translateService: TranslateService,
    private kafkaService: KafkaService,
  ) {}

  /**
   * Handler triggered when register fraudDetection is pending.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.PIX_FRAUD_DETECTION.REGISTERED_PENDING)
  async execute(
    @Payload('value')
    message: HandleRegisterPendingPixFraudDetectionEventRequest,
    @JdpiPixFraudDetectionGatewayParam()
    pixFraudDetectionGateway: PixFraudDetectionGateway,
    @JiraPixFraudDetectionGatewayParam()
    pixFraudDetectionIssueGateway: IssuePixFraudDetectionGateway,
    @RepositoryParam(PixFraudDetectionDatabaseRepository)
    pixFraudDetectionRepository: PixFraudDetectionRepository,
    @EventEmitterParam(PixFraudDetectionEventKafkaEmitter)
    pixFraudDetectionEventEmitter: PixFraudDetectionEventEmitterControllerInterface,
    @LoggerParam(RegisterPendingPixFraudDetectionNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Register message.', { value: message });

    // Parse kafka message.
    const payload = new HandleRegisterPendingPixFraudDetectionEventRequest({
      id: message.id,
    });

    logger.info('Handle register pending pix fraud detection event.', {
      payload,
    });

    const controller =
      new HandleRegisterPendingPixFraudDetectionEventController(
        logger,
        pixFraudDetectionRepository,
        pixFraudDetectionGateway,
        pixFraudDetectionIssueGateway,
        pixFraudDetectionEventEmitter,
      );

    try {
      // Call register pending pix fraud detection handler.
      const result = await controller.execute(payload);

      logger.info('Register pending pix fraud detection.', { result });
    } catch (error) {
      const logError = error.data?.isAxiosError ? error.data.message : error;
      logger.error('Failed to register pending pix fraud detection.', {
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
