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
  HandleCancelPendingPixInfractionReceivedEventController,
  HandleCancelPendingPixInfractionReceivedEventRequest,
  HandleRevertPixInfractionEventRequest,
  PixInfractionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type HandleCancelPendingPixInfractionReceivedEventKafkaRequest =
  KafkaMessage<HandleCancelPendingPixInfractionReceivedEventRequest>;

/**
 * PixInfraction cancel events observer.
 */
@Controller()
@ObserverController([JiraPixInfractionInterceptor])
export class CancelPendingPixInfractionReceivedNestObserver {
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
  @KafkaEventPattern(KAFKA_EVENTS.PIX_INFRACTION.CANCEL_PENDING_RECEIVED)
  async execute(
    @Payload('value')
    message: HandleCancelPendingPixInfractionReceivedEventRequest,
    @RepositoryParam(PixInfractionDatabaseRepository)
    infractionRepository: PixInfractionRepository,
    @JiraPixInfractionGatewayParam()
    infractionGateway: IssueInfractionGateway,
    @EventEmitterParam(PixInfractionEventKafkaEmitter)
    infractionEventEmitter: PixInfractionEventEmitterControllerInterface,
    @LoggerParam(CancelPendingPixInfractionReceivedNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleCancelPendingPixInfractionReceivedEventRequest(
      message,
    );

    logger.info('Handle pending infraction.', { payload });

    const controller =
      new HandleCancelPendingPixInfractionReceivedEventController(
        logger,
        infractionRepository,
        infractionGateway,
        infractionEventEmitter,
      );

    try {
      // Call open infraction handle.
      const result = await controller.execute(payload);

      logger.info('Infraction canceled.', { result });
    } catch (error) {
      const logError = error.data?.isAxiosError ? error.data.message : error;
      logger.error('Failed to cancel infraction.', { error: logError });

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
