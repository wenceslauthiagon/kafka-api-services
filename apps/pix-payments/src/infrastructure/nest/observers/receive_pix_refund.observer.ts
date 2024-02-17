import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import {
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  RepositoryParam,
  ObserverController,
  EventEmitterParam,
  KafkaServiceParam,
  MissingEnvVarException,
} from '@zro/common';
import {
  PixInfractionRepository,
  PixRefundRepository,
  PixDevolutionReceivedRepository,
  PixDepositRepository,
  PixInfractionRefundOperationRepository,
} from '@zro/pix-payments/domain';
import {
  KAFKA_EVENTS,
  PixInfractionDatabaseRepository,
  PixRefundEventKafkaEmitter,
  PixRefundDatabaseRepository,
  PixDepositDatabaseRepository,
  PixDevolutionReceivedDatabaseRepository,
  OperationServiceKafka,
  PixInfractionRefundOperationDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import {
  HandleReceivePixRefundEventRequest,
  HandleReceivePixRefundEventController,
  PixRefundEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type ReceivePixRefundKafkaRequest =
  KafkaMessage<HandleReceivePixRefundEventRequest>;

export interface ReceivePixRefundConfig {
  APP_OPERATION_CURRENCY_TAG: string;
  APP_OPERATION_REFUND_TRANSACTION_TAG: string;
}

/**
 * Receive pix refund events observer.
 */
@Controller()
@ObserverController()
export class ReceivePixRefundNestObserver {
  private pixPaymentOperationCurrencyTag: string;
  private pixPaymentOperationPixRefundTransactionTag: string;

  constructor(private configService: ConfigService<ReceivePixRefundConfig>) {
    this.pixPaymentOperationCurrencyTag = this.configService.get<string>(
      'APP_OPERATION_CURRENCY_TAG',
    );
    this.pixPaymentOperationPixRefundTransactionTag =
      this.configService.get<string>('APP_OPERATION_REFUND_TRANSACTION_TAG');

    if (
      !this.pixPaymentOperationCurrencyTag ||
      !this.pixPaymentOperationPixRefundTransactionTag
    ) {
      throw new MissingEnvVarException([
        ...(!this.pixPaymentOperationCurrencyTag
          ? ['APP_OPERATION_CURRENCY_TAG']
          : []),
        ...(!this.pixPaymentOperationPixRefundTransactionTag
          ? ['APP_OPERATION_REFUND_TRANSACTION_TAG']
          : []),
      ]);
    }
  }

  /**
   * Consumer of create receive pix refund.
   *
   * @param refundRepository Pix refund repository.
   * @param infractionRepository Pix infraction repository.
   * @param paymentRepository Pix payment repository.
   * @param devolutionRepository Pix devolution repository.
   * @param operationService User Service
   * @param eventEmitter ReceivePixRefund event emitter.
   * @param logger Request logger.
   * @param message Request Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.PIX_REFUND.RECEIVE)
  async execute(
    @RepositoryParam(PixRefundDatabaseRepository)
    refundRepository: PixRefundRepository,
    @RepositoryParam(PixInfractionDatabaseRepository)
    infractionRepository: PixInfractionRepository,
    @RepositoryParam(PixDepositDatabaseRepository)
    depositRepository: PixDepositRepository,
    @RepositoryParam(PixDevolutionReceivedDatabaseRepository)
    devolutionReceivedRepository: PixDevolutionReceivedRepository,
    @RepositoryParam(PixInfractionRefundOperationDatabaseRepository)
    pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository,
    @EventEmitterParam(PixRefundEventKafkaEmitter)
    eventEmitter: PixRefundEventEmitterControllerInterface,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @LoggerParam(ReceivePixRefundNestObserver)
    logger: Logger,
    @Payload('value') message: HandleReceivePixRefundEventRequest,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleReceivePixRefundEventRequest(message);

    logger.info('Receive pix refund.', { payload });

    // Create and call receive pix refund controller.
    const controller = new HandleReceivePixRefundEventController(
      logger,
      refundRepository,
      infractionRepository,
      depositRepository,
      devolutionReceivedRepository,
      pixInfractionRefundOperationRepository,
      eventEmitter,
      operationService,
      this.pixPaymentOperationCurrencyTag,
      this.pixPaymentOperationPixRefundTransactionTag,
    );

    // Create receive pix refund.
    await controller.execute(payload);

    logger.info('Receive pix refund created.');
  }
}
