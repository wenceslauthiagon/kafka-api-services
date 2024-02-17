import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Ctx, KafkaContext, Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  RepositoryParam,
  ObserverController,
  EventEmitterParam,
  TranslateService,
  KafkaService,
  FailedEntity,
} from '@zro/common';
import {
  JiraPixInfractionGatewayParam,
  JiraPixInfractionInterceptor,
} from '@zro/jira';
import { PixInfractionRepository } from '@zro/pix-payments/domain';
import { IssueInfractionGateway } from '@zro/pix-payments/application';
import {
  KAFKA_EVENTS,
  PixInfractionDatabaseRepository,
  PixInfractionEventKafkaEmitter,
} from '@zro/pix-payments/infrastructure';
import {
  HandleAcknowledgePendingPixInfractionEventController,
  HandleAcknowledgePendingPixInfractionEventRequest,
  HandleRevertPixInfractionEventRequest,
  PixInfractionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type HandleAcknowledgePendingPixInfractionEventKafkaRequest =
  KafkaMessage<HandleAcknowledgePendingPixInfractionEventRequest>;

/**
 * PixInfraction complete events observer.
 */
@Controller()
@ObserverController([JiraPixInfractionInterceptor])
export class AcknowledgePendingPixInfractionNestObserver {
  constructor(
    private kafkaService: KafkaService,
    private translateService: TranslateService,
  ) {}

  /**
   * Handler triggered when infraction is complete.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.PIX_INFRACTION.ACKNOWLEDGED_PENDING)
  async execute(
    @Payload('value')
    message: HandleAcknowledgePendingPixInfractionEventRequest,
    @RepositoryParam(PixInfractionDatabaseRepository)
    infractionRepository: PixInfractionRepository,
    @JiraPixInfractionGatewayParam()
    infractionGateway: IssueInfractionGateway,
    @EventEmitterParam(PixInfractionEventKafkaEmitter)
    infractionEventEmitter: PixInfractionEventEmitterControllerInterface,
    @LoggerParam(AcknowledgePendingPixInfractionNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleAcknowledgePendingPixInfractionEventRequest(
      message,
    );

    logger.info('Handle pending infraction.', { payload });

    const controller = new HandleAcknowledgePendingPixInfractionEventController(
      logger,
      infractionRepository,
      infractionGateway,
      infractionEventEmitter,
    );

    try {
      // Call open infraction handle.
      const result = await controller.execute(payload);

      logger.info('Infraction acknowledged.', { result });
    } catch (error) {
      const logError = error.data?.isAxiosError ? error.data.message : error;
      logger.error('Failed to acknowledge infraction.', { error: logError });

      const errorMessage = await this.translateService.translateException(
        'default_exceptions',
        error,
      );

      const failed = new FailedEntity({
        code: error.code,
        message: errorMessage,
      });
      const value: HandleRevertPixInfractionEventRequest = {
        ...message,
        failed,
      };

      await this.kafkaService.emit(KAFKA_EVENTS.PIX_INFRACTION.REVERTED, {
        ...ctx.getMessage(),
        value,
      });
    }
  }
}
