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
import {
  PaymentRepository,
  PixDevolutionRepository,
  PixInfractionRepository,
} from '@zro/pix-payments/domain';
import {
  IssueInfractionGateway,
  PixInfractionGateway,
} from '@zro/pix-payments/application';
import {
  KAFKA_EVENTS,
  PixInfractionDatabaseRepository,
  PixInfractionEventKafkaEmitter,
  PaymentDatabaseRepository,
  PixDevolutionDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import {
  HandleOpenPendingPixInfractionEventController,
  HandleOpenPendingPixInfractionEventRequest,
  HandleRevertPixInfractionEventRequest,
  PixInfractionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import {
  JdpiPixInfractionGatewayParam,
  JdpiPixInfractionInterceptor,
} from '@zro/jdpi';

export type HandleOpenPendingPixInfractionEventKafkaRequest =
  KafkaMessage<HandleOpenPendingPixInfractionEventRequest>;

/**
 * PixInfraction complete events observer.
 */
@Controller()
@ObserverController([
  JdpiPixInfractionInterceptor,
  JiraPixInfractionInterceptor,
])
export class OpenPendingPixInfractionNestObserver {
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
  @KafkaEventPattern(KAFKA_EVENTS.PIX_INFRACTION.OPEN_PENDING)
  async execute(
    @Payload('value') message: HandleOpenPendingPixInfractionEventRequest,
    @JdpiPixInfractionGatewayParam()
    pixInfractionGateway: PixInfractionGateway,
    @JiraPixInfractionGatewayParam()
    issueInfractionGateway: IssueInfractionGateway,
    @RepositoryParam(PixInfractionDatabaseRepository)
    infractionRepository: PixInfractionRepository,
    @RepositoryParam(PaymentDatabaseRepository)
    paymentRepository: PaymentRepository,
    @RepositoryParam(PixDevolutionDatabaseRepository)
    devolutionRepository: PixDevolutionRepository,
    @EventEmitterParam(PixInfractionEventKafkaEmitter)
    infractionEventEmitter: PixInfractionEventEmitterControllerInterface,
    @LoggerParam(OpenPendingPixInfractionNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleOpenPendingPixInfractionEventRequest(message);

    logger.info('Handle pending infraction.', { payload });

    const controller = new HandleOpenPendingPixInfractionEventController(
      logger,
      pixInfractionGateway,
      issueInfractionGateway,
      infractionRepository,
      infractionEventEmitter,
      paymentRepository,
      devolutionRepository,
    );

    try {
      // Call open infraction handle.
      const result = await controller.execute(payload);

      logger.info('Infraction opened.', { result });
    } catch (error) {
      const logError = error.data?.isAxiosError ? error.data.message : error;
      logger.error('Failed to open infraction.', { error: logError });

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
