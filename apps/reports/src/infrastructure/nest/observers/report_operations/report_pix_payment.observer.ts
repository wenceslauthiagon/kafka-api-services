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
  HandleCreateReportOperationByPixPaymentConfirmedEventRequest,
  HandleCreateReportOperationByPixPaymentConfirmedEventController,
} from '@zro/reports/interface';
import {
  OperationServiceKafka,
  ReportOperationDatabaseRepository,
  KAFKA_HUB,
} from '@zro/reports/infrastructure';
import { OperationService } from '@zro/reports/application';
import { ConfigService } from '@nestjs/config';

export type PixPaymentEventKafkaRequest =
  KafkaMessage<HandleCreateReportOperationByPixPaymentConfirmedEventRequest>;

export interface ReportPixPaymentConfig {
  APP_OPERATION_CURRENCY_TAG: string;
  APP_ZROBANK_ISPB: string;
}

/**
 * Report operations events observer.
 */
@Controller()
@ObserverController()
export class ReportPixPaymentNestObserver {
  private operationCurrencyTag: string;
  private zroBankIspb: string;

  constructor(
    private configService: ConfigService<ReportPixPaymentConfig>,
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

  @KafkaEventPattern(KAFKA_EVENTS.PAYMENT.CONFIRMED)
  async handleConfirmedPaymentEvent(
    @Payload('value')
    message: HandleCreateReportOperationByPixPaymentConfirmedEventRequest,
    @RepositoryParam(ReportOperationDatabaseRepository)
    reportOperationRepository: ReportOperationDatabaseRepository,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationService,
    @LoggerParam(ReportPixPaymentNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload =
      new HandleCreateReportOperationByPixPaymentConfirmedEventRequest({
        id: message.id,
        userId: message.userId,
        operationId: message.operationId,
        transactionTag: message.transactionTag,
        beneficiaryName: message.beneficiaryName,
        beneficiaryDocument: message.beneficiaryDocument,
        beneficiaryBankIspb: message.beneficiaryBankIspb,
        beneficiaryBranch: message.beneficiaryBranch,
        beneficiaryAccountNumber: message.beneficiaryAccountNumber,
        ownerFullName: message.ownerFullName,
        ownerDocument: message.ownerDocument,
        ownerBranch: message.ownerBranch,
        ownerAccountNumber: message.ownerAccountNumber,
      });

    logger.info('Send payment confirmed for create report operation.', {
      payload,
    });

    const controller =
      new HandleCreateReportOperationByPixPaymentConfirmedEventController(
        logger,
        reportOperationRepository,
        operationService,
        this.operationCurrencyTag,
        this.zroBankIspb,
      );

    try {
      // Call the handle payment completed event controller.
      const result = await controller.execute(payload);

      logger.info('Confirmed payment report operation.', { result });
    } catch (error) {
      logger.error('Failed to send confirmed payment report operation.', {
        error,
      });

      // FIXME: Should notify IT team.
      await this.kafkaService.emit(
        KAFKA_HUB.REPORT_OPERATION.PIX_PAYMENT.DEAD_LETTER,
        ctx.getMessage(),
      );
    }
  }
}
