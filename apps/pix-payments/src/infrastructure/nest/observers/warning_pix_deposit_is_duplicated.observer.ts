import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import {
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  ObserverController,
  EventEmitterParam,
  MissingEnvVarException,
  RedisService,
} from '@zro/common';
import {
  KAFKA_EVENTS,
  PixDepositEventKafkaEmitter,
  PixDepositRedisRepository,
} from '@zro/pix-payments/infrastructure';
import {
  HandleWarningPixDepositIsDuplicatedEventController,
  HandleWarningPixDepositIsDuplicatedEventRequest,
  PixDepositEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type HandleWarningPixDepositIsDuplicatedEventKafkaRequest =
  KafkaMessage<HandleWarningPixDepositIsDuplicatedEventRequest>;

interface WarningPixDepositIsDuplicatedConfig {
  APP_WARNING_PIX_DEPOSIT_MIN_AMOUNT: number;
  APP_WARNING_PIX_DEPOSIT_RECEIVED_DEPOSIT_TTL: number;
  APP_WARNING_PIX_DEPOSIT_HASH_TTL: number;
}

/**
 * Pix receive pending deposit events observer.
 */
@Controller()
@ObserverController()
export class WarningPixDepositIsDuplicatedNestObserver {
  private readonly warningPixDepositMinAmount: number;
  private readonly depositTtl: number;
  private readonly hashTtl: number;
  private readonly pixDepositCacheRepository: PixDepositRedisRepository;

  constructor(
    readonly configService: ConfigService<WarningPixDepositIsDuplicatedConfig>,
    readonly redisService: RedisService,
  ) {
    this.warningPixDepositMinAmount = configService.get<number>(
      'APP_WARNING_PIX_DEPOSIT_MIN_AMOUNT',
    );

    this.depositTtl = configService.get<number>(
      'APP_WARNING_PIX_DEPOSIT_RECEIVED_DEPOSIT_TTL',
    );

    this.hashTtl = configService.get<number>(
      'APP_WARNING_PIX_DEPOSIT_HASH_TTL',
    );

    if (!this.warningPixDepositMinAmount || !this.depositTtl || !this.hashTtl) {
      throw new MissingEnvVarException([
        ...(!this.warningPixDepositMinAmount
          ? ['APP_WARNING_PIX_DEPOSIT_MIN_AMOUNT']
          : []),
        ...(!this.depositTtl
          ? ['APP_WARNING_PIX_DEPOSIT_RECEIVED_DEPOSIT_TTL']
          : []),
        ...(!this.hashTtl ? ['APP_WARNING_PIX_DEPOSIT_HASH_TTL'] : []),
      ]);
    }

    this.pixDepositCacheRepository = new PixDepositRedisRepository(
      redisService,
      this.depositTtl,
      this.hashTtl,
    );
  }

  /**
   * Handler triggered when deposit is processing.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.PIX_DEPOSIT.NEW)
  async execute(
    @Payload('value')
    message: HandleWarningPixDepositIsDuplicatedEventRequest,
    @EventEmitterParam(PixDepositEventKafkaEmitter)
    depositEventEmitter: PixDepositEventEmitterControllerInterface,
    @LoggerParam(WarningPixDepositIsDuplicatedNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleWarningPixDepositIsDuplicatedEventRequest(
      message,
    );

    logger.info('Handle received deposit new event.', { payload });

    const controller = new HandleWarningPixDepositIsDuplicatedEventController(
      logger,
      this.pixDepositCacheRepository,
      depositEventEmitter,
      this.warningPixDepositMinAmount,
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
