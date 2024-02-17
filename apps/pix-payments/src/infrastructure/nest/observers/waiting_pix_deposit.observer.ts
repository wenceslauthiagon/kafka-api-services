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
  RedisService,
} from '@zro/common';
import {
  PixDepositRepository,
  WarningPixDepositRepository,
} from '@zro/pix-payments/domain';
import {
  KAFKA_EVENTS,
  PixDepositDatabaseRepository,
  PixDepositEventKafkaEmitter,
  OperationServiceKafka,
  ComplianceServiceKafka,
  WarningPixDepositDatabaseRepository,
  WarningPixDepositEventKafkaEmitter,
  PixDepositRedisRepository,
} from '@zro/pix-payments/infrastructure';
import {
  HandleWaitingPixDepositEventController,
  HandleWaitingPixDepositEventRequest,
  PixDepositEventEmitterControllerInterface,
  WarningPixDepositEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type HandleWaitingPixDepositEventKafkaRequest =
  KafkaMessage<HandleWaitingPixDepositEventRequest>;

interface WaitingPixDepositConfig {
  APP_OPERATION_CURRENCY_TAG: string;
  APP_OPERATION_PIX_RECEIVED_DEPOSIT_TRANSACTION_TAG: string;
}

/**
 * Pix receive pending deposit events observer.
 */
@Controller()
@ObserverController()
export class WaitingPixDepositNestObserver {
  private readonly pixPaymentOperationCurrencyTag: string;
  private readonly pixPaymentOperationNewPixReceivedTransactionTag: string;
  private readonly pixDepositCacheRepository: PixDepositRedisRepository;

  constructor(
    readonly configService: ConfigService<WaitingPixDepositConfig>,
    readonly redisService: RedisService,
  ) {
    this.pixPaymentOperationCurrencyTag = configService.get<string>(
      'APP_OPERATION_CURRENCY_TAG',
    );

    this.pixPaymentOperationNewPixReceivedTransactionTag =
      configService.get<string>(
        'APP_OPERATION_PIX_RECEIVED_DEPOSIT_TRANSACTION_TAG',
      );

    if (
      !this.pixPaymentOperationCurrencyTag ||
      !this.pixPaymentOperationNewPixReceivedTransactionTag
    ) {
      throw new MissingEnvVarException([
        ...(!this.pixPaymentOperationCurrencyTag
          ? ['APP_OPERATION_CURRENCY_TAG']
          : []),
        ...(!this.pixPaymentOperationNewPixReceivedTransactionTag
          ? ['APP_OPERATION_PIX_RECEIVED_DEPOSIT_TRANSACTION_TAG']
          : []),
      ]);
    }

    this.pixDepositCacheRepository = new PixDepositRedisRepository(
      redisService,
    );
  }

  /**
   * Handler triggered when deposit is processing.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.PIX_DEPOSIT.WAITING)
  async execute(
    @Payload('value')
    message: HandleWaitingPixDepositEventRequest,
    @RepositoryParam(PixDepositDatabaseRepository)
    pixDepositRepository: PixDepositRepository,
    @RepositoryParam(WarningPixDepositDatabaseRepository)
    warningPixDepositRepository: WarningPixDepositRepository,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @KafkaServiceParam(ComplianceServiceKafka)
    complianceService: ComplianceServiceKafka,
    @EventEmitterParam(WarningPixDepositEventKafkaEmitter)
    warningPixDepositEventEmitter: WarningPixDepositEventEmitterControllerInterface,
    @EventEmitterParam(PixDepositEventKafkaEmitter)
    pixDepositEventEmitter: PixDepositEventEmitterControllerInterface,
    @LoggerParam(WaitingPixDepositNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleWaitingPixDepositEventRequest(message);

    logger.info('Handle received deposit waiting event.', { payload });

    const controller = new HandleWaitingPixDepositEventController(
      logger,
      pixDepositRepository,
      warningPixDepositRepository,
      operationService,
      complianceService,
      warningPixDepositEventEmitter,
      pixDepositEventEmitter,
      this.pixDepositCacheRepository,
      this.pixPaymentOperationCurrencyTag,
      this.pixPaymentOperationNewPixReceivedTransactionTag,
    );

    try {
      // Call receive deposit handler.
      const result = await controller.execute(payload);

      logger.info('Deposit received.', { result });
    } catch (error) {
      logger.error('Failed to process deposit.', error);
    }
  }
}
