import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  EventEmitterParam,
  LoggerParam,
  KafkaServiceParam,
  MissingEnvVarException,
  RepositoryParam,
  ObserverController,
} from '@zro/common';
import { PixDepositRepository } from '@zro/pix-payments/domain';
import {
  KAFKA_EVENTS,
  BankingServiceKafka,
  PixDepositEventKafkaEmitter,
  PixDevolutionEventKafkaEmitter,
  PixDepositDatabaseRepository,
  UserServiceKafka,
} from '@zro/pix-payments/infrastructure';
import {
  ReceivePixDepositRequest,
  PixDepositEventEmitterControllerInterface,
  PixDevolutionEventEmitterControllerInterface,
  HandleReceiveFailedPixDepositEventController,
} from '@zro/pix-payments/interface';

export type HandleReceiveFailedPixDepositEventKafkaRequest =
  KafkaMessage<ReceivePixDepositRequest>;

interface PixDepositOperationConfig {
  APP_OPERATION_PIX_RECEIVED_DEPOSIT_TRANSACTION_TAG: string;
  APP_ZROBANK_ISPB: string;
}

/**
 * Pix receive failed deposit due to account not found events observer.
 */
@Controller()
@ObserverController()
export class ReceiveFailedPixDepositNestObserver {
  private pixPaymentOperationNewPixReceivedTransactionTag: string;
  private pixPaymentZroBankIspb: string;

  constructor(private configService: ConfigService<PixDepositOperationConfig>) {
    this.pixPaymentOperationNewPixReceivedTransactionTag =
      this.configService.get<string>(
        'APP_OPERATION_PIX_RECEIVED_DEPOSIT_TRANSACTION_TAG',
      );

    this.pixPaymentZroBankIspb =
      this.configService.get<string>('APP_ZROBANK_ISPB');

    if (
      !this.pixPaymentOperationNewPixReceivedTransactionTag ||
      !this.pixPaymentZroBankIspb
    ) {
      throw new MissingEnvVarException([
        ...(!this.pixPaymentOperationNewPixReceivedTransactionTag
          ? ['APP_OPERATION_PIX_RECEIVED_DEPOSIT_TRANSACTION_TAG']
          : []),
        ...(!this.pixPaymentZroBankIspb ? ['APP_ZROBANK_ISPB'] : []),
      ]);
    }
  }

  /**
   * Handler triggered when failed deposit is processing.
   *
   * @param message Event Kafka message.
   * @param pixDepositRepository Pix deposit repository.
   * @param pixDepositEventEmitter Pix deposit event emitter.
   * @param pixDevolutionEventEmitter Pix devolution event emitter.
   * @param operationService Operation service gateway.
   * @param bankingService Banking service.
   * @param logger Global logger instance.
   */
  @KafkaEventPattern(KAFKA_EVENTS.PIX_DEPOSIT.NEW_FAILED)
  async execute(
    @Payload('value')
    message: ReceivePixDepositRequest,
    @RepositoryParam(PixDepositDatabaseRepository)
    pixDepositRepository: PixDepositRepository,
    @EventEmitterParam(PixDepositEventKafkaEmitter)
    pixDepositEventEmitter: PixDepositEventEmitterControllerInterface,
    @EventEmitterParam(PixDevolutionEventKafkaEmitter)
    pixDevolutionEventEmitter: PixDevolutionEventEmitterControllerInterface,
    @KafkaServiceParam(BankingServiceKafka)
    bankingService: BankingServiceKafka,
    @KafkaServiceParam(UserServiceKafka)
    userService: UserServiceKafka,
    @LoggerParam(ReceiveFailedPixDepositNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new ReceivePixDepositRequest(message);

    logger.info('Create a failed received deposit.');

    const controller = new HandleReceiveFailedPixDepositEventController(
      logger,
      pixDepositRepository,
      pixDepositEventEmitter,
      pixDevolutionEventEmitter,
      bankingService,
      userService,
      this.pixPaymentOperationNewPixReceivedTransactionTag,
      this.pixPaymentZroBankIspb,
    );

    try {
      // Call receive failed deposit handler.
      const result = await controller.execute(payload);

      logger.info('Failed deposit received.', { result });
    } catch (error) {
      logger.error('Failed to process failed deposit.', error);
    }
  }
}
