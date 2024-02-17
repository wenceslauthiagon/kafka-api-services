import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  RepositoryParam,
  ObserverController,
  KafkaServiceParam,
  MissingEnvVarException,
  KafkaService,
} from '@zro/common';
import { KAFKA_EVENTS } from '@zro/pix-payments/infrastructure';
import {
  HandleCreateReportOperationByPixDevolutionReceivedReadyEventRequest,
  HandleCreateReportOperationByPixDevolutionReceivedReadyEventController,
} from '@zro/reports/interface';
import {
  OperationServiceKafka,
  ReportOperationDatabaseRepository,
  KAFKA_HUB,
} from '@zro/reports/infrastructure';
import { OperationService } from '@zro/reports/application';
import { ConfigService } from '@nestjs/config';

export type PixDevolutionReceivedEventKafkaRequest =
  KafkaMessage<HandleCreateReportOperationByPixDevolutionReceivedReadyEventRequest>;

export interface ReportPixDevolutionReceivedConfig {
  APP_OPERATION_CURRENCY_TAG: string;
  APP_ZROBANK_ISPB: string;
}

/**
 * Report operations events observer.
 */
@Controller()
@ObserverController()
export class ReportPixDevolutionReceivedNestObserver {
  private operationCurrencyTag: string;
  private zroBankIspb: string;

  constructor(
    private configService: ConfigService<ReportPixDevolutionReceivedConfig>,
    private kafkaService: KafkaService,
  ) {
    this.operationCurrencyTag = this.configService.get<string>(
      'APP_OPERATION_CURRENCY_TAG',
    );
    this.zroBankIspb = this.configService.get<string>('APP_ZROBANK_ISPB');

    if (!this.operationCurrencyTag || !this.zroBankIspb) {
      throw new MissingEnvVarException([
        ...(!this.operationCurrencyTag ? ['APP_OPERATION_CURRENCY_TAG'] : []),
        ...(!this.zroBankIspb ? ['APP_ZROBANK_ISPB'] : []),
      ]);
    }
  }

  @KafkaEventPattern(KAFKA_EVENTS.PIX_DEVOLUTION_RECEIVED.READY)
  async handleDevolutionReceivedEvent(
    @Payload('value')
    message: HandleCreateReportOperationByPixDevolutionReceivedReadyEventRequest,
    @RepositoryParam(ReportOperationDatabaseRepository)
    reportOperationRepository: ReportOperationDatabaseRepository,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationService,
    @LoggerParam(ReportPixDevolutionReceivedNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload =
      new HandleCreateReportOperationByPixDevolutionReceivedReadyEventRequest({
        id: message.id,
        operationId: message.operationId,
        transactionTag: message.transactionTag,
        thirdPartName: message.thirdPartName,
        thirdPartDocument: message.thirdPartDocument,
        thirdPartBranch: message.thirdPartBranch,
        thirdPartBankIspb: message.thirdPartBankIspb,
        thirdPartAccountNumber: message.thirdPartAccountNumber,
        userId: message.userId,
        clientName: message.clientName,
        clientDocument: message.clientDocument,
        clientBranch: message.clientBranch,
        clientAccountNumber: message.clientAccountNumber,
      });

    logger.info('Send pix devolution received for create report operation.', {
      payload,
    });

    const controller =
      new HandleCreateReportOperationByPixDevolutionReceivedReadyEventController(
        logger,
        reportOperationRepository,
        operationService,
        this.operationCurrencyTag,
        this.zroBankIspb,
      );

    try {
      // Call the handle devolution received event controller.
      const result = await controller.execute(payload);

      logger.info('Received devolution report operation.', { result });
    } catch (error) {
      logger.error('Failed to send received devolution report operation.', {
        error,
      });

      // FIXME: Should notify IT team.
      await this.kafkaService.emit(
        KAFKA_HUB.REPORT_OPERATION.PIX_DEVOLUTION_RECEIVED.DEAD_LETTER,
        ctx.getMessage(),
      );
    }
  }
}
