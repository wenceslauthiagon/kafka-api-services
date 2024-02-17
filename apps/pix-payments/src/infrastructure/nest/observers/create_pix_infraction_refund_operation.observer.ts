import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  RepositoryParam,
  ObserverController,
  KafkaServiceParam,
  MissingEnvVarException,
} from '@zro/common';
import {
  KAFKA_EVENTS,
  OperationServiceKafka,
  PixInfractionRefundOperationDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import { OperationService } from '@zro/pix-payments/application';
import { ConfigService } from '@nestjs/config';
import { PixInfractionRefundOperationRepository } from '@zro/pix-payments/domain';
import {
  HandleCreatePixInfractionRefundOperationController,
  HandleCreatePixInfractionRefundOperationEventRequest,
} from '@zro/pix-payments/interface';

export type CreatePixInfractionRefundOperationEventKafkaRequest =
  KafkaMessage<HandleCreatePixInfractionRefundOperationEventRequest>;

export interface CreatePixInfractionRefundOperationConfig {
  APP_OPERATION_CURRENCY_TAG: string;
  APP_OPERATION_REFUND_TRANSACTION_TAG: string;
}

/**
 * Create pix infraction refund operation events observer.
 */
@Controller()
@ObserverController()
export class CreatePixInfractionRefundOperationNestObserver {
  private pixPaymentOperationCurrencyTag: string;
  private pixPaymentOperationRefundTransactionTag: string;

  constructor(
    private configService: ConfigService<CreatePixInfractionRefundOperationConfig>,
  ) {
    this.pixPaymentOperationCurrencyTag = this.configService.get<string>(
      'APP_OPERATION_CURRENCY_TAG',
    );
    this.pixPaymentOperationRefundTransactionTag =
      this.configService.get<string>('APP_OPERATION_REFUND_TRANSACTION_TAG');

    if (
      !this.pixPaymentOperationCurrencyTag ||
      !this.pixPaymentOperationRefundTransactionTag
    ) {
      throw new MissingEnvVarException([
        ...(!this.pixPaymentOperationCurrencyTag
          ? ['APP_OPERATION_CURRENCY_TAG']
          : []),
        ...(!this.pixPaymentOperationRefundTransactionTag
          ? ['APP_OPERATION_REFUND_TRANSACTION_TAG']
          : []),
      ]);
    }
  }

  @KafkaEventPattern(KAFKA_EVENTS.PIX_DEPOSIT.RECEIVED)
  async handleDepositReceivedEvent(
    @Payload('value')
    message: HandleCreatePixInfractionRefundOperationEventRequest,
    @RepositoryParam(PixInfractionRefundOperationDatabaseRepository)
    pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationService,
    @LoggerParam(CreatePixInfractionRefundOperationNestObserver)
    logger: Logger,
  ): Promise<void> {
    await this.handle(
      message,
      pixInfractionRefundOperationRepository,
      operationService,
      logger,
    );
  }

  @KafkaEventPattern(KAFKA_EVENTS.PIX_DEVOLUTION_RECEIVED.READY)
  async handleDevolutionReceivedEvent(
    @Payload('value')
    message: HandleCreatePixInfractionRefundOperationEventRequest,
    @RepositoryParam(PixInfractionRefundOperationDatabaseRepository)
    pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationService,
    @LoggerParam(CreatePixInfractionRefundOperationNestObserver)
    logger: Logger,
  ): Promise<void> {
    await this.handle(
      message,
      pixInfractionRefundOperationRepository,
      operationService,
      logger,
    );
  }

  private async handle(
    message: HandleCreatePixInfractionRefundOperationEventRequest,
    pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository,
    operationService: OperationService,
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleCreatePixInfractionRefundOperationEventRequest({
      refundOperationId: message.refundOperationId,
      id: message.id,
      state: message.state,
      userId: message.userId,
      walletId: message.walletId,
      amount: message.amount,
    });

    logger.info('Create pix infraction refund operation.', {
      payload,
    });

    const controller = new HandleCreatePixInfractionRefundOperationController(
      logger,
      pixInfractionRefundOperationRepository,
      operationService,
      this.pixPaymentOperationCurrencyTag,
      this.pixPaymentOperationRefundTransactionTag,
    );

    try {
      // Call the handle pix infraction refund operation event controller.
      await controller.execute(payload);

      logger.info('Handled create pix infraction refund operation.');
    } catch (error) {
      logger.error('Failed to handle create pix infraction refund operation.', {
        error,
      });
    }
  }
}
