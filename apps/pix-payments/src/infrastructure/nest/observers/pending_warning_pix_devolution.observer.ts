import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  EventEmitterParam,
  KafkaService,
  LoggerParam,
  RepositoryParam,
  ObserverController,
  TranslateService,
  FailedEntity,
  KafkaServiceParam,
  MissingEnvVarException,
} from '@zro/common';
import {
  JdpiPixPaymentInterceptor,
  JdpiPixPaymentGatewayParam,
} from '@zro/jdpi';
import {
  PixDepositRepository,
  WarningPixDevolutionRepository,
} from '@zro/pix-payments/domain';
import {
  PixPaymentGateway,
  IssueWarningTransactionGateway,
} from '@zro/pix-payments/application';
import {
  WarningPixDevolutionDatabaseRepository,
  PixDepositDatabaseRepository,
  WarningPixDevolutionEventKafkaEmitter,
  KAFKA_EVENTS,
  KAFKA_HUB,
  OperationServiceKafka,
  ComplianceServiceKafka,
} from '@zro/pix-payments/infrastructure';
import {
  HandlePendingWarningPixDevolutionEventController,
  WarningPixDevolutionEventEmitterControllerInterface,
  HandlePendingWarningPixDevolutionEventRequest,
  HandleRevertWarningPixDevolutionEventRequest,
} from '@zro/pix-payments/interface';
import {
  JiraWarningTransactionGatewayParam,
  JiraWarningTransactionInterceptor,
} from '@zro/jira';

export type HandlePendingWarningPixDevolutionEventKafkaRequest =
  KafkaMessage<HandlePendingWarningPixDevolutionEventRequest>;

interface PendingWarningPixDevolutionConfig {
  APP_JIRA_MESSAGE_USER_REQUEST_WARNING_PIX_DEVOLUTION: string;
}

/**
 * WarningPixDevolution pending events observer.
 */
@Controller()
@ObserverController([
  JdpiPixPaymentInterceptor,
  JiraWarningTransactionInterceptor,
])
export class PendingWarningPixDevolutionNestObserver {
  private messageUserRequestWarningPixDevolution: string;

  constructor(
    private kafkaService: KafkaService,
    private translateService: TranslateService,
    private configService: ConfigService<PendingWarningPixDevolutionConfig>,
  ) {
    this.kafkaService.createEvents([
      KAFKA_HUB.WARNING_PIX_DEVOLUTION.PENDING.TOPAZIO_GATEWAY,
    ]);

    this.messageUserRequestWarningPixDevolution =
      this.configService.get<string>(
        'APP_JIRA_MESSAGE_USER_REQUEST_WARNING_PIX_DEVOLUTION',
      );

    if (!this.messageUserRequestWarningPixDevolution) {
      throw new MissingEnvVarException(
        'APP_JIRA_MESSAGE_USER_REQUEST_WARNING_PIX_DEVOLUTION',
      );
    }
  }
  /**
   * Handler triggered when devolution is pending.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.WARNING_PIX_DEVOLUTION.PENDING)
  async handlePendingWarningPixDevolutionEvent(
    @Payload('value') message: HandlePendingWarningPixDevolutionEventRequest,
    @LoggerParam(PendingWarningPixDevolutionNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.info('Received pending warnign pix devolution event.', {
      value: message,
    });

    // Select topazio gateway to add warning pix devolution.
    await this.kafkaService.emit(
      KAFKA_HUB.WARNING_PIX_DEVOLUTION.PENDING.TOPAZIO_GATEWAY,
      ctx.getMessage(),
    );
  }
  /**
   * Handler triggered when devolution is pending.
   *
   * @param message Event Kafka message.
   * @param warningPixDevolutionRepository warningPixDevolution repository.
   * @param depositRepository PixDeposit repository.
   * @param serviceEventEmitter Event emitter.
   * @param pspGateway WarningPixDevolution psp gateway.
   * @param operationService Operation service.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.WARNING_PIX_DEVOLUTION.PENDING.TOPAZIO_GATEWAY)
  async handlePendingWarningPixDevolutionEventViaTopazio(
    @Payload('value') message: HandlePendingWarningPixDevolutionEventRequest,
    @RepositoryParam(WarningPixDevolutionDatabaseRepository)
    warningPixDevolutionRepository: WarningPixDevolutionRepository,
    @RepositoryParam(PixDepositDatabaseRepository)
    depositRepository: PixDepositRepository,
    @EventEmitterParam(WarningPixDevolutionEventKafkaEmitter)
    serviceEventEmitter: WarningPixDevolutionEventEmitterControllerInterface,
    @JdpiPixPaymentGatewayParam()
    pspGateway: PixPaymentGateway,
    @JiraWarningTransactionGatewayParam()
    issueWarningTransactionGateway: IssueWarningTransactionGateway,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @KafkaServiceParam(ComplianceServiceKafka)
    complianceService: ComplianceServiceKafka,
    @LoggerParam(PendingWarningPixDevolutionNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandlePendingWarningPixDevolutionEventRequest(message);

    logger.info('Handle added event pending warning pix devolution.', {
      payload,
    });

    const controller = new HandlePendingWarningPixDevolutionEventController(
      logger,
      warningPixDevolutionRepository,
      depositRepository,
      serviceEventEmitter,
      pspGateway,
      issueWarningTransactionGateway,
      operationService,
      complianceService,
      this.messageUserRequestWarningPixDevolution,
    );

    try {
      // Call the warnign pix devolution controller.
      const result = await controller.execute(payload);
      logger.info('WarningPixDevolution updated.', { result });
    } catch (error) {
      const logError = error.data?.isAxiosError ? error.data.message : error;
      logger.error('Failed to add warningPixDevolution.', { error: logError });

      const errorMessage = await this.translateService.translateException(
        'default_exceptions',
        error,
      );
      const failed = new FailedEntity({
        code: error.code,
        message: errorMessage,
      });
      const value: HandleRevertWarningPixDevolutionEventRequest = {
        ...message,
        failed,
      };

      await this.kafkaService.emit(
        KAFKA_EVENTS.WARNING_PIX_DEVOLUTION.REVERTED,
        { ...ctx.getMessage(), value },
      );
    }
  }
}
