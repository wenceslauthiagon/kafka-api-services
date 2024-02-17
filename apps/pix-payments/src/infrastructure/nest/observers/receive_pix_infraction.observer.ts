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
  PixDevolutionReceivedRepository,
  PixDepositRepository,
  PixInfractionRefundOperationRepository,
} from '@zro/pix-payments/domain';
import {
  KAFKA_EVENTS,
  PixInfractionDatabaseRepository,
  PixDepositDatabaseRepository,
  PixDevolutionReceivedDatabaseRepository,
  OperationServiceKafka,
  PixInfractionRefundOperationDatabaseRepository,
  PixInfractionEventKafkaEmitter,
} from '@zro/pix-payments/infrastructure';
import {
  HandleReceivePixInfractionEventRequest,
  PixInfractionEventEmitterControllerInterface,
  HandleReceivePixInfractionEventController,
} from '@zro/pix-payments/interface';

export type ReceivePixInfractionKafkaRequest =
  KafkaMessage<HandleReceivePixInfractionEventRequest>;

export interface ReceivePixInfractionConfig {
  APP_OPERATION_CURRENCY_TAG: string;
  APP_OPERATION_REFUND_TRANSACTION_TAG: string;
}

/**
 * Receive pix infraction events observer.
 */
@Controller()
@ObserverController()
export class ReceivePixInfractionNestObserver {
  private pixPaymentOperationCurrencyTag: string;
  private pixPaymentOperationInfractionTransactionTag: string;

  constructor(
    private configService: ConfigService<ReceivePixInfractionConfig>,
  ) {
    this.pixPaymentOperationCurrencyTag = this.configService.get<string>(
      'APP_OPERATION_CURRENCY_TAG',
    );
    this.pixPaymentOperationInfractionTransactionTag =
      this.configService.get<string>('APP_OPERATION_REFUND_TRANSACTION_TAG');

    if (
      !this.pixPaymentOperationCurrencyTag ||
      !this.pixPaymentOperationInfractionTransactionTag
    ) {
      throw new MissingEnvVarException([
        ...(!this.pixPaymentOperationCurrencyTag
          ? ['APP_OPERATION_CURRENCY_TAG']
          : []),
        ...(!this.pixPaymentOperationInfractionTransactionTag
          ? ['APP_OPERATION_REFUND_TRANSACTION_TAG']
          : []),
      ]);
    }
  }

  /**
   * Consumer of create receive pix infraction.
   *
   * @param infractionRepository Infraction repository.
   * @param depositRepository Deposit repository.
   * @param devolutionReceivedRepository Devolution received repository.
   * @param pixInfractionRefundOperationRepository Pix infraction refund operation repository.
   * @param operationService User Service
   * @param eventEmitter ReceiveInfractionReceived event emitter.
   * @param logger Request logger.
   * @param message Request Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.PIX_INFRACTION.RECEIVE)
  async execute(
    @RepositoryParam(PixInfractionDatabaseRepository)
    infractionRepository: PixInfractionRepository,
    @RepositoryParam(PixDepositDatabaseRepository)
    depositRepository: PixDepositRepository,
    @RepositoryParam(PixDevolutionReceivedDatabaseRepository)
    devolutionReceivedRepository: PixDevolutionReceivedRepository,
    @RepositoryParam(PixInfractionRefundOperationDatabaseRepository)
    pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository,
    @EventEmitterParam(PixInfractionEventKafkaEmitter)
    eventEmitter: PixInfractionEventEmitterControllerInterface,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @LoggerParam(ReceivePixInfractionNestObserver)
    logger: Logger,
    @Payload('value') message: HandleReceivePixInfractionEventRequest,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleReceivePixInfractionEventRequest(message);

    logger.info('Receive infraction.', { payload });

    // Create and call receive Infraction controller.
    const controller = new HandleReceivePixInfractionEventController(
      logger,
      infractionRepository,
      depositRepository,
      devolutionReceivedRepository,
      pixInfractionRefundOperationRepository,
      eventEmitter,
      operationService,
      this.pixPaymentOperationCurrencyTag,
      this.pixPaymentOperationInfractionTransactionTag,
    );

    // Create receive pix infraction.
    await controller.execute(payload);

    logger.info('Receive pix infraction created.');
  }
}
