import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  RepositoryParam,
  ObserverController,
  EventEmitterParam,
  FailedEntity,
  TranslateService,
  KafkaService,
} from '@zro/common';
import {
  JiraPixInfractionGatewayParam,
  JiraPixInfractionInterceptor,
} from '@zro/jira';
import {
  PixDepositRepository,
  PixDevolutionReceivedRepository,
  PixInfractionRepository,
} from '@zro/pix-payments/domain';
import { IssueInfractionGateway } from '@zro/pix-payments/application';
import {
  KAFKA_EVENTS,
  PixInfractionDatabaseRepository,
  PixDevolutionReceivedDatabaseRepository,
  PixDepositDatabaseRepository,
  PixInfractionEventKafkaEmitter,
} from '@zro/pix-payments/infrastructure';
import {
  HandleReceivePendingPixInfractionController,
  HandleReceivePendingPixInfractionRequest,
  HandleRevertPixInfractionEventRequest,
  PixInfractionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type HandleReceivePendingPixInfractionEventKafkaRequest =
  KafkaMessage<HandleReceivePendingPixInfractionRequest>;

interface ReceivePendingPixInfractionConfig {
  APP_JIRA_INFRACTION_DUE_DATE: string;
}

/**
 * Pix receive pending infraction events observer.
 */
@Controller()
@ObserverController([JiraPixInfractionInterceptor])
export class ReceivePendingPixInfractionNestObserver {
  private infractionDueDate: string;

  constructor(
    private translateService: TranslateService,
    private kafkaService: KafkaService,
    private configService: ConfigService<ReceivePendingPixInfractionConfig>,
  ) {
    this.infractionDueDate = this.configService.get<string>(
      'APP_JIRA_INFRACTION_DUE_DATE',
      '7',
    );
  }

  /**
   * Handler triggered when received infraction is pending.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.PIX_INFRACTION.RECEIVE_PENDING)
  async execute(
    @Payload('value')
    message: HandleReceivePendingPixInfractionRequest,
    @JiraPixInfractionGatewayParam()
    infractionGateway: IssueInfractionGateway,
    @RepositoryParam(PixInfractionDatabaseRepository)
    infractionRepository: PixInfractionRepository,
    @RepositoryParam(PixDepositDatabaseRepository)
    depositRepository: PixDepositRepository,
    @RepositoryParam(PixDevolutionReceivedDatabaseRepository)
    devolutionReceivedRepository: PixDevolutionReceivedRepository,
    @EventEmitterParam(PixInfractionEventKafkaEmitter)
    infractionEventEmitter: PixInfractionEventEmitterControllerInterface,
    @LoggerParam(ReceivePendingPixInfractionNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleReceivePendingPixInfractionRequest(message);

    logger.info('Handle received infraction pending event.', { payload });

    const controller = new HandleReceivePendingPixInfractionController(
      logger,
      infractionRepository,
      depositRepository,
      devolutionReceivedRepository,
      infractionGateway,
      infractionEventEmitter,
      this.infractionDueDate,
    );

    try {
      // Call receive infraction handler.
      const result = await controller.execute(payload);

      logger.info('Infraction received.', { result });
    } catch (error) {
      const logError = error.data?.isAxiosError ? error.data.message : error;
      logger.error('Failed to receive infraction.', { error: logError });

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
