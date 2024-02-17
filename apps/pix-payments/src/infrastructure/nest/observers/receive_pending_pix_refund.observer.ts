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
  JiraIssueRefundGatewayParam,
  JiraIssueRefundInterceptor,
} from '@zro/jira';
import {
  PixRefundRepository,
  PixDepositRepository,
  PixDevolutionReceivedRepository,
} from '@zro/pix-payments/domain';
import { IssueRefundGateway } from '@zro/pix-payments/application';
import {
  KAFKA_EVENTS,
  PixRefundDatabaseRepository,
  PixDepositDatabaseRepository,
  PixDevolutionReceivedDatabaseRepository,
  PixRefundEventKafkaEmitter,
} from '@zro/pix-payments/infrastructure';
import {
  HandleReceivePendingPixRefundController,
  HandleReceivePendingPixRefundRequest,
  HandleRevertPixRefundEventRequest,
  PixRefundEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type HandleReceivePendingPixRefundEventKafkaRequest =
  KafkaMessage<HandleReceivePendingPixRefundRequest>;

/**
 * Pix receive pending refund events observer.
 */
@Controller()
@ObserverController([JiraIssueRefundInterceptor])
export class ReceivePendingPixRefundNestObserver {
  constructor(
    private translateService: TranslateService,
    private kafkaService: KafkaService,
  ) {}

  /**
   * Handler triggered when received pix refund is pending.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.PIX_REFUND.RECEIVE_PENDING)
  async execute(
    @Payload('value') message: HandleReceivePendingPixRefundRequest,
    @JiraIssueRefundGatewayParam()
    issueRefundGateway: IssueRefundGateway,
    @RepositoryParam(PixRefundDatabaseRepository)
    refundRepository: PixRefundRepository,
    @RepositoryParam(PixDepositDatabaseRepository)
    depositRepository: PixDepositRepository,
    @RepositoryParam(PixDevolutionReceivedDatabaseRepository)
    devolutionReceivedRepository: PixDevolutionReceivedRepository,
    @EventEmitterParam(PixRefundEventKafkaEmitter)
    refundEventEmitter: PixRefundEventEmitterControllerInterface,
    @LoggerParam(ReceivePendingPixRefundNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleReceivePendingPixRefundRequest(message);

    logger.info('Handle received pix refund pending event.', { payload });

    // TODO pixRefundGateway receive incorrect value because pix refund jira is not
    // implemented yet
    const controller = new HandleReceivePendingPixRefundController(
      logger,
      refundRepository,
      depositRepository,
      devolutionReceivedRepository,
      issueRefundGateway,
      refundEventEmitter,
    );

    try {
      // Call receive pix refund handler.
      const result = await controller.execute(payload);

      logger.info('PixRefund received.', { result });
    } catch (error) {
      const logError = error.data?.isAxiosError ? error.data.message : error;
      logger.error('Failed to receive refund.', { error: logError });

      const errorMessage = await this.translateService.translateException(
        'default_exceptions',
        error,
      );

      const failed = new FailedEntity({
        code: error.code,
        message: errorMessage,
      });
      const value: HandleRevertPixRefundEventRequest = {
        ...message,
        failed,
      };

      await this.kafkaService.emit(KAFKA_EVENTS.PIX_REFUND.REVERTED, {
        ...ctx.getMessage(),
        value,
      });
      throw error;
    }
  }
}
